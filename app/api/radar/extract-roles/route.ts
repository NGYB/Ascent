import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface RoleExtractionResult {
  domain: string;
  primaryRole: string;
  suggestedRoles: string[];
  seniority?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return NextResponse.json(
        { error: 'Please provide resumeText to analyze.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = Boolean(apiKey && apiKey !== 'your-gemini-api-key-here');

    if (hasGeminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey! });

        const prompt = `
You are an expert executive talent recruiter, career advisor, and intelligence specialist across ALL industries and professions (such as Intellectual Property / Patent Law, B2B Enterprise Sales, Human Resources & Talent, Corporate Finance & Accounting, Operations & Supply Chain, Healthcare, Marketing & Communications, Software Engineering, Management Consulting, Legal, Education, etc.).

Analyze the candidate's Master Resume/CV:
"""
${resumeText.slice(0, 4500)}
"""

Your goal is to accurately determine their career domain and generate the most effective job titles to search on live job search engines (Google Jobs, LinkedIn, Indeed).

Strict Rules:
1. Complete Domain Agnosticism: Keep it 100% faithful to the candidate's actual discipline, seniority, and industry.
2. No Tech Bias: Do NOT assume or default to tech, software engineering, or product management roles unless the CV explicitly reflects a career in software or tech engineering.
   - For example:
     - An IP Consultant / Patent Attorney should target roles like "Senior Patent Counsel", "IP Strategy Consultant", "Head of Intellectual Property", "Technology Transfer Specialist".
     - A Sales Leader should target roles like "Director of Enterprise Sales", "VP of Business Development", "Regional Sales Director", "Head of Commercial Accounts".
     - A Finance Professional should target roles like "Head of Financial Planning & Analysis", "Financial Controller", "Finance Director".
     - An Operations Lead should target roles like "Director of Operations", "Chief Operating Officer", "VP of Supply Chain".
3. "primaryRole": The single most representative, high-accuracy job title matching their most recent seniority and specialization for job portal queries.
4. "suggestedRoles": 3 to 4 realistic, high-value alternative or adjacent target job titles (promotions, lateral moves, or specialized equivalents) within their actual field.
5. "domain": A concise 2-4 word name for their functional discipline or industry.
6. "seniority": Seniority tier (e.g., "Executive / Director", "Senior / Lead", "Mid-Level", "Specialist").

Respond strictly in valid JSON format:
{
  "domain": "Domain Name",
  "primaryRole": "Exact Target Job Title",
  "suggestedRoles": ["Title 1", "Title 2", "Title 3", "Title 4"],
  "seniority": "Seniority Level"
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        if (response.text) {
          const parsed: RoleExtractionResult = JSON.parse(response.text);
          if (parsed.primaryRole) {
            return NextResponse.json({
              success: true,
              source: 'gemini',
              domain: parsed.domain || 'Professional Services',
              primaryRole: parsed.primaryRole.trim(),
              suggestedRoles: Array.isArray(parsed.suggestedRoles) && parsed.suggestedRoles.length > 0 
                ? parsed.suggestedRoles.map(r => r.trim())
                : [parsed.primaryRole.trim()],
              seniority: parsed.seniority || 'Experienced'
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini role extraction failed, falling back to heuristic:', geminiError);
      }
    }

    // Domain-agnostic heuristic fallback if Gemini key is missing or call fails
    const fallbackResult = extractRoleHeuristic(resumeText);
    return NextResponse.json({
      success: true,
      source: 'heuristic',
      domain: fallbackResult.domain,
      primaryRole: fallbackResult.primaryRole,
      suggestedRoles: fallbackResult.suggestedRoles,
      seniority: fallbackResult.seniority
    });

  } catch (error: any) {
    console.error('Role extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract roles' },
      { status: 500 }
    );
  }
}

// Domain-agnostic heuristic fallback that looks for headline titles without hardcoded tech bias
function extractRoleHeuristic(text: string): RoleExtractionResult {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 90);

  // Common title keywords across diverse industries
  const titleKeywords = [
    'patent', 'intellectual property', 'counsel', 'attorney', 'legal',
    'sales', 'business development', 'account executive', 'commercial',
    'operations', 'supply chain', 'procurement', 'logistics',
    'finance', 'accounting', 'controller', 'fp&a', 'treasury',
    'human resources', 'talent', 'people partner', 'recruiting',
    'marketing', 'brand', 'growth', 'communications',
    'consultant', 'strategy', 'advisory',
    'director', 'vice president', 'vp', 'head of', 'manager', 'lead', 'chief', 'specialist'
  ];

  let detectedTitle = '';

  // Look through the first 25 non-empty lines (where name, title, summary, or top role lives)
  for (const line of lines.slice(0, 25)) {
    const lower = line.toLowerCase();
    
    // Ignore lines that look like emails, phone numbers, addresses, or links
    if (lower.includes('@') || lower.includes('http') || lower.includes('.com') || /^\+?\d[\d\s-]{7,}/.test(line)) {
      continue;
    }

    // Ignore typical section headings
    if (/^(experience|education|skills|summary|profile|work history|certifications|awards|languages|interests)$/i.test(lower)) {
      continue;
    }

    // Check if line contains known professional title markers
    const hasKeyword = titleKeywords.some(kw => lower.includes(kw));
    if (hasKeyword && line.split(' ').length >= 2 && line.split(' ').length <= 7) {
      // Clean up common bullet points or dashes
      detectedTitle = line.replace(/^[•\-\*|\d\.]+\s*/, '').replace(/\|.*$/, '').trim();
      break;
    }
  }

  // If still not found, check the 2nd line of resume (often the professional subtitle under name)
  if (!detectedTitle && lines.length > 1) {
    const candidateLine = lines[1];
    if (candidateLine.length >= 5 && candidateLine.length <= 50 && !candidateLine.includes('@')) {
      detectedTitle = candidateLine.replace(/^[•\-\*|\d\.]+\s*/, '').trim();
    }
  }

  if (!detectedTitle) {
    detectedTitle = 'Senior Professional Consultant';
  }

  // Derive domain from detected title
  let domain = 'General Business & Strategy';
  const lowerTitle = detectedTitle.toLowerCase();
  if (lowerTitle.includes('patent') || lowerTitle.includes('ip') || lowerTitle.includes('counsel') || lowerTitle.includes('legal') || lowerTitle.includes('attorney')) {
    domain = 'Intellectual Property & Legal';
  } else if (lowerTitle.includes('sale') || lowerTitle.includes('account') || lowerTitle.includes('commercial') || lowerTitle.includes('business dev')) {
    domain = 'Sales & Business Development';
  } else if (lowerTitle.includes('financ') || lowerTitle.includes('account') || lowerTitle.includes('audit') || lowerTitle.includes('fp&a')) {
    domain = 'Finance & Accounting';
  } else if (lowerTitle.includes('hr') || lowerTitle.includes('talent') || lowerTitle.includes('people')) {
    domain = 'Human Resources & Talent';
  } else if (lowerTitle.includes('operation') || lowerTitle.includes('supply chain') || lowerTitle.includes('logistics')) {
    domain = 'Operations & Supply Chain';
  } else if (lowerTitle.includes('market') || lowerTitle.includes('brand')) {
    domain = 'Marketing & Growth';
  } else if (lowerTitle.includes('engineer') || lowerTitle.includes('developer') || lowerTitle.includes('software')) {
    domain = 'Engineering & Technology';
  }

  // Generate adjacent role variations based on the detected title
  const cleanBase = detectedTitle.replace(/^(senior|lead|head of|director of|vp of|chief)\s+/i, '').trim();
  const suggestedRoles = [
    detectedTitle,
    `Senior ${cleanBase}`,
    `Director of ${cleanBase}`,
    `Principal ${cleanBase} Consultant`
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  return {
    domain,
    primaryRole: detectedTitle,
    suggestedRoles,
    seniority: detectedTitle.toLowerCase().includes('director') || detectedTitle.toLowerCase().includes('vp') || detectedTitle.toLowerCase().includes('head') ? 'Director / Executive' : 'Senior'
  };
}
