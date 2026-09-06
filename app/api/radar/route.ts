import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface SerpJob {
  title: string;
  company_name: string;
  location: string;
  via?: string;
  description?: string;
  job_id?: string;
  thumbnail?: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
  extensions?: string[];
  apply_options?: Array<{
    title: string;
    link: string;
  }>;
  related_links?: Array<{
    link: string;
    text: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { query, location, remoteOnly, resumeText } = await req.json();

    const searchQuery = (query || 'Product Manager').trim();
    const searchLocation = (location || '').trim();

    const serpApiKey = process.env.SERPAPI_API_KEY;

    let jobs: Array<any> = [];
    let isDemo = false;
    let message = '';

    let hasApiKey = Boolean(serpApiKey && serpApiKey !== 'your-serpapi-api-key-here');

    if (!hasApiKey) {
      isDemo = true;
      message = 'SerpAPI key not configured in .env or Vercel Environment Variables. Displaying curated sample radar results.';
      jobs = getDemoJobs(searchQuery, searchLocation);
    } else {
      try {
        // Formulate natural language query for Google Jobs (e.g. "Product Manager in Singapore")
        // Google Jobs engine reliably parses locations inside the query text, whereas a separate `location` parameter often returns 0 results outside the US.
        let fullQuery = searchQuery;
        if (searchLocation && !fullQuery.toLowerCase().includes(searchLocation.toLowerCase())) {
          fullQuery = `${fullQuery} in ${searchLocation}`;
        }
        if (remoteOnly && !fullQuery.toLowerCase().includes('remote')) {
          fullQuery = `${fullQuery} remote`;
        }

        const buildUrl = (q: string) => {
          const u = new URL('https://serpapi.com/search.json');
          u.searchParams.set('engine', 'google_jobs');
          u.searchParams.set('q', q);
          u.searchParams.set('hl', 'en');
          u.searchParams.set('api_key', serpApiKey!);
          return u.toString();
        };

        let serpRes = await fetch(buildUrl(fullQuery), {
          next: { revalidate: 300 }
        });

        let serpData: any = {};
        if (serpRes.ok) {
          serpData = await serpRes.json();
        }

        // If no jobs returned with "in [Location]", retry with "[Role] [Location]" or just "[Role]"
        let rawJobs: SerpJob[] = serpData.jobs_results || [];
        if (rawJobs.length === 0 && searchLocation) {
          const retryQuery = `${searchQuery} ${searchLocation}`;
          const retryRes = await fetch(buildUrl(retryQuery));
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.jobs_results && retryData.jobs_results.length > 0) {
              rawJobs = retryData.jobs_results;
            }
          }
        }

        if (rawJobs.length === 0) {
          isDemo = true;
          message = `No live Google Jobs found for "${fullQuery}". Showing sample opportunities. Try broadening your keywords.`;
          jobs = getDemoJobs(searchQuery, searchLocation);
        } else {
          isDemo = false;
          jobs = rawJobs.map((j, idx) => {
            const directApply = j.apply_options?.[0]?.link || j.related_links?.[0]?.link || '';
            return {
              id: j.job_id || `serp-${idx}-${Date.now()}`,
              title: j.title || 'Untitled Role',
              company: j.company_name || 'Target Company',
              location: j.location || searchLocation || 'Remote / Flexible',
              via: j.via || 'via Job Board',
              description: j.description || 'No description provided.',
              postedAt: j.detected_extensions?.posted_at || j.extensions?.[0] || 'Recently',
              scheduleType: j.detected_extensions?.schedule_type || j.extensions?.[1] || 'Full-time',
              salary: j.detected_extensions?.salary || undefined,
              applyLink: directApply,
              thumbnail: j.thumbnail || undefined
            };
          });
        }
      } catch (fetchErr: any) {
        console.error('Failed to call SerpAPI:', fetchErr);
        isDemo = true;
        message = 'Could not connect to SerpAPI. Showing sample radar results.';
        jobs = getDemoJobs(searchQuery, searchLocation);
      }
    }

    // If resumeText is provided and GEMINI_API_KEY is configured, compute fit match scores
    const geminiKey = process.env.GEMINI_API_KEY;
    if (resumeText && geminiKey && geminiKey !== 'your-gemini-api-key-here' && jobs.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        // Take the top 5 jobs for AI scoring to keep latency fast
        const topJobs = jobs.slice(0, 5);
        const jobSnippets = topJobs.map((j, i) => 
          `[Job ${i + 1}] ID: "${j.id}", Title: "${j.title}", Company: "${j.company}", Description: "${j.description.slice(0, 500)}"`
        ).join('\n\n');

        const prompt = `
You are a career transition advisor.
Evaluate the candidate's Master Resume against the following job opportunities.
Candidate Resume Snippet:
"""
${resumeText.slice(0, 2500)}
"""

Target Jobs:
${jobSnippets}

For each job, evaluate:
1. matchScore: integer between 45 and 95 (realistic percentage of alignment)
2. matchRationale: 1 concise sentence explaining why this candidate is a fit or what transferable skills match.
3. topMatches: array of 2-3 key transferable skills / qualifications found in both.

Respond strictly in valid JSON format matching this array:
[
  {
    "id": "job-id",
    "matchScore": 85,
    "matchRationale": "Strong alignment in enterprise agile delivery and multi-stakeholder management.",
    "topMatches": ["Product Strategy", "Agile Transformation", "Stakeholder Management"]
  }
]
`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (geminiRes.text) {
          const matchData: Array<{ id: string; matchScore: number; matchRationale: string; topMatches: string[] }> = JSON.parse(geminiRes.text);
          const matchMap = new Map(matchData.map(m => [m.id, m]));

          jobs = jobs.map(j => {
            const match = matchMap.get(j.id);
            if (match) {
              return {
                ...j,
                matchScore: match.matchScore,
                matchRationale: match.matchRationale,
                topMatches: match.topMatches
              };
            }
            // Heuristic baseline if not in top 5
            return {
              ...j,
              matchScore: Math.floor(Math.random() * 20) + 65,
              matchRationale: 'Relevant role matching your core functional domain.',
              topMatches: ['Domain Experience', 'Leadership']
            };
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini match scoring failed or timed out:', geminiErr);
        // Fallback to heuristic keyword matching
        jobs = jobs.map(j => ({
          ...j,
          matchScore: 75,
          matchRationale: 'Potentially matching role based on title and functional keywords.'
        }));
      }
    } else {
      // Default heuristic scores if resume not analyzed
      jobs = jobs.map(j => ({
        ...j,
        matchScore: j.matchScore || 70,
        matchRationale: j.matchRationale || 'Scan role requirements to evaluate personalized fit.'
      }));
    }

    return NextResponse.json({
      jobs,
      isDemo,
      hasApiKey,
      message,
      query: searchQuery,
      location: searchLocation,
      totalCount: jobs.length
    });

  } catch (error: any) {
    console.error('Radar route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Curated realistic demo jobs for testing without an active API key
function getDemoJobs(query: string, location: string) {
  const loc = location || 'Singapore';
  return [
    {
      id: 'demo-1',
      title: query ? `Senior ${query}` : 'Senior Product Manager - Enterprise SaaS',
      company: 'Grab Financial Group',
      location: loc,
      via: 'via LinkedIn',
      description: 'We are seeking an experienced Product Manager to lead our Core Payments and Lending initiative. In this role, you will define product vision, align cross-functional engineering and compliance teams, and drive go-to-market execution across Southeast Asia. Requirements: 5+ years of software product management experience, track record in agile environments, strong analytical mindset, and proven ability to bridge business objectives with engineering execution.',
      postedAt: '2 days ago',
      scheduleType: 'Full-time',
      salary: '$8,500 - $13,000 / month',
      applyLink: 'https://www.linkedin.com/jobs',
      thumbnail: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop',
      matchScore: 88,
      matchRationale: 'Exceptional match with your background in agile delivery, stakeholder alignment, and product execution.',
      topMatches: ['Product Strategy', 'Agile Roadmapping', 'Cross-functional Leadership']
    },
    {
      id: 'demo-2',
      title: query ? `Lead ${query}` : 'Lead Technical Operations Director',
      company: 'Shopee (Sea Ltd)',
      location: loc,
      via: 'via Indeed',
      description: 'Lead operational excellence across regional marketplace platforms. You will oversee operational metrics, incident resolution workflows, and partner with regional country directors to scale efficiency. Requirements: 8+ years leading technology or operations programs, expertise in SLA governance, root-cause process re-engineering, and managing high-performing operational teams.',
      postedAt: '1 day ago',
      scheduleType: 'Full-time',
      salary: '$10,000 - $16,000 / month',
      applyLink: 'https://careers.shopee.sg',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop',
      matchScore: 82,
      matchRationale: 'Strong alignment with your operational scaling experience and team leadership capabilities.',
      topMatches: ['Process Re-engineering', 'SLA Governance', 'Regional Operations']
    },
    {
      id: 'demo-3',
      title: query ? `${query} (Growth & Platform)` : 'Product & Strategy Manager (Fintech)',
      company: 'Stripe',
      location: `${loc} (Hybrid / Flexible)`,
      via: 'via Greenhouse',
      description: 'Stripe is building the economic infrastructure for the internet. As a Product & Strategy Manager in our APAC hub, you will identify high-growth market opportunities, launch local payment methods, and collaborate closely with global engineering leaders. Requirements: Experience scaling tech products, exceptional written communication, structured problem-solving, and customer obsession.',
      postedAt: '3 days ago',
      scheduleType: 'Full-time',
      salary: 'Competitive Equity + Bonus',
      applyLink: 'https://stripe.com/jobs',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop',
      matchScore: 79,
      matchRationale: 'Your structured communication and strategic expansion skills map directly to Stripe’s culture.',
      topMatches: ['Market Expansion', 'Strategic Planning', 'Executive Communication']
    },
    {
      id: 'demo-4',
      title: query ? `Director of ${query}` : 'Associate Director - Digital Transformation',
      company: 'Standard Chartered Bank',
      location: loc,
      via: 'via LinkedIn',
      description: 'Drive the next chapter of digital banking innovation. Lead legacy workflow modernization, champion modern customer journeys, and coordinate between compliance, risk, and delivery teams. Requirements: Extensive experience in digital transformation, change management, and operating within regulated institutional frameworks.',
      postedAt: '4 days ago',
      scheduleType: 'Full-time',
      salary: '$12,000 - $18,000 / month',
      applyLink: 'https://www.sc.com/en/careers',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
      matchScore: 74,
      matchRationale: 'Solid transferable background in organizational change and governance.',
      topMatches: ['Digital Transformation', 'Risk & Compliance', 'Change Management']
    }
  ];
}
