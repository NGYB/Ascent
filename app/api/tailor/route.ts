import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobTitle, company, jobDescription } = await req.json();

    if (!resumeText || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeText, jobTitle, or jobDescription' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add it to your .env file.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert resume writer and career coach specializing in mid-career professional transitions.
Analyze the user's master resume and the target job description for the role of "${jobTitle}"${company ? ` at ${company}` : ''}.
Your task is to:
1. Tailor the resume to match the target job description, optimizing formatting and phrasing to align with target role requirements. Focus on translating transferable skills and industry-specific jargon into general or target-industry terminology.
2. Maintain all original facts, dates, companies, and roles—do not hallucinate or invent new roles, companies, or credentials.
3. Perform an ATS keyword matching and gap analysis.
4. Calculate an estimated ATS match score (0-100) for BOTH the original master resume (representing the 'before' baseline) and the newly tailored resume (representing the 'after' optimization).
5. As a world-class career coach, evaluate how aligned the target job description is to the user's background (the original master resume). Provide a career coach alignment score from 0 to 100 (where 100 represents a perfect fit). Structure your evaluation into three distinct fields, and return each as a clean JSON array of strings (do not prefix the items with bullet points like '-' or numbers, just return the raw statements as list items):
   (a) strengths: An array of strings describing their top transferable skills and areas of alignment.
   (b) gaps: An array of strings describing the structural, experience, or skill gaps they face.
   (c) suggestions: An array of strings describing strategic, actionable coaching suggestions and positioning recommendations to bridge those gaps.
6. Perform a "JD Deflator" analysis using a 4-layer recruiter heuristic model to separate non-negotiable dealbreakers from recruiter wishlist fluff:
   - Layer 1 (Structural Cues): Look for explicit "Minimum/Basic Qualifications" vs "Preferred/Bonus Qualifications".
   - Layer 2 (Linguistic Modality): Distinguish obligatory language ("must have", "proven track record", "5+ years", "required") from flexible language ("familiarity with", "nice to have", "exposure to", "plus").
   - Layer 3 (Learnability Horizon): Categorize core foundational competencies (requiring 6+ months of experience) as Must-Haves, while interchangeable tool syntax/libraries (learnable within 1-2 weeks on the job) should be Good-to-Haves.
   - Layer 4 (Centrality): Check if the skill is central to core daily deliverables vs peripheral requirements.
   - Identify 3 to 6 true "mustHaves" (dealbreakers). For each, assess if the candidate matches from their CV, explain the recruiter's rationale for why it's a hard filter, and provide candidate evidence or explanation.
   - Identify 3 to 6 "goodToHaves" (wishlist/learnable). For each, assess match status, explain why it's flexible, and provide actionable substitute advice (how their existing skills compensate or how quickly they can ramp up).
   - Calculate mustHavesMatchRate (0-100) and goodToHavesMatchRate (0-100).
   - Provide a confidence-boosting, realistic recruiter "verdict" string (e.g. "Green Light to Apply: You satisfy 100% of the core dealbreakers. The missing items are learnable on the job.").

Input Resume:
"""
${resumeText}
"""

Input Job Description:
"""
${jobDescription}
"""

Generate the tailored resume in clean markdown format, perform the ATS gap analysis, provide the career coach evaluation, and complete the JD Deflator analysis.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tailoredResume: {
              type: Type.STRING,
              description: 'The fully tailored resume in clean, professional markdown format.',
            },
            atsAnalysis: {
              type: Type.OBJECT,
              properties: {
                beforeScore: {
                  type: Type.INTEGER,
                  description: 'Estimated ATS match score from 0 to 100 of the original master resume against the target job description.',
                },
                afterScore: {
                  type: Type.INTEGER,
                  description: 'Estimated ATS match score from 0 to 100 of the tailored resume against the target job description.',
                },
                matchingKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Keywords present in both the resume and the job description.',
                },
                missingKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Keywords present in the job description but missing or weak in the resume.',
                },
                learningActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Actionable upskilling suggestions, certifications, or online courses to address the missing keywords.',
                },
                transferableSkills: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: {
                        type: Type.STRING,
                        description: 'How the skill or experience was originally phrased in the resume.',
                      },
                      tailored: {
                        type: Type.STRING,
                        description: 'The rewritten/tailored phrasing used in the tailored resume.',
                      },
                      explanation: {
                        type: Type.STRING,
                        description: 'Why this translation helps fit the target role or bypass ATS.',
                      },
                    },
                    required: ['original', 'tailored', 'explanation'],
                  },
                },
              },
              required: [
                'beforeScore',
                'afterScore',
                'matchingKeywords',
                'missingKeywords',
                'learningActions',
                'transferableSkills',
              ],
            },
            coachFeedback: {
              type: Type.OBJECT,
              properties: {
                alignmentScore: {
                  type: Type.INTEGER,
                  description: 'A career coach evaluation score from 0 to 100 rating how aligned the job description is to their original background.'
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'An array of strings listing top transferable strengths and areas of alignment.'
                },
                gaps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'An array of strings listing structural, experience, or skill gaps.'
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'An array of strings listing coaching suggestions and advice.'
                }
              },
              required: ['alignmentScore', 'strengths', 'gaps', 'suggestions']
            },
            jdDeflator: {
              type: Type.OBJECT,
              properties: {
                verdict: {
                  type: Type.STRING,
                  description: 'An encouraging, empowering recruiter summary verdict explaining whether they should apply (e.g., "Green Light to Apply: You satisfy 100% of the core dealbreakers...").'
                },
                mustHavesMatchRate: {
                  type: Type.INTEGER,
                  description: 'Percentage (0 to 100) of must-have requirements the candidate satisfies.'
                },
                goodToHavesMatchRate: {
                  type: Type.INTEGER,
                  description: 'Percentage (0 to 100) of good-to-have wishlist requirements the candidate satisfies.'
                },
                mustHaves: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      skill: { type: Type.STRING, description: 'The core non-negotiable requirement or capability.' },
                      matched: { type: Type.BOOLEAN, description: 'Whether the candidate meets this requirement.' },
                      recruiterRationale: { type: Type.STRING, description: 'Why the recruiter considers this a hard filter or day-1 expectation.' },
                      candidateEvidence: { type: Type.STRING, description: 'Proof from candidate CV or why it is met/unmet.' }
                    },
                    required: ['skill', 'matched', 'recruiterRationale', 'candidateEvidence']
                  },
                  description: 'Array of 3 to 6 true dealbreaker requirements extracted from the JD.'
                },
                goodToHaves: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      skill: { type: Type.STRING, description: 'Tool, specific syntax, or wishlist requirement.' },
                      matched: { type: Type.BOOLEAN, description: 'Whether the candidate matches this specific tool or preference.' },
                      recruiterRationale: { type: Type.STRING, description: 'Why this is flexible, secondary, or learnable on the job within 1-2 weeks.' },
                      substituteAdvice: { type: Type.STRING, description: 'Transferable skill or experience the candidate has that substitutes for this.' }
                    },
                    required: ['skill', 'matched', 'recruiterRationale', 'substituteAdvice']
                  },
                  description: 'Array of 3 to 6 wishlist or learnable-on-the-job requirements.'
                }
              },
              required: ['verdict', 'mustHavesMatchRate', 'goodToHavesMatchRate', 'mustHaves', 'goodToHaves']
            }
          },
          required: ['tailoredResume', 'atsAnalysis', 'coachFeedback', 'jdDeflator'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Tailoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor CV' },
      { status: 500 }
    );
  }
}
