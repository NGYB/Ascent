import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const maxDuration = 60;

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
You are an executive resume writer and career transition coach specializing in mid-career PMET (Professional, Manager, Executive, and Technical) transitions.
Analyze the user's master resume and the target job description for the role of "${jobTitle}"${company ? ` at ${company}` : ''}.

============================================================
CORE PRINCIPLES & GUARDRAILS FOR TAILORING (MUST STRICTLY FOLLOW):
============================================================

1. THE INTERVIEW DEFENSIBILITY STANDARD ("THE PROBE TEST"):
   - Every single claim, bullet, and skill must be 100% defensible by the candidate in a high-stakes hiring manager or technical probe interview without hesitation or backtracking.
   - If an interviewer asks "Walk me through how you implemented X at Company Y," the candidate must have actually done X at Company Y. Never put the candidate in an indefensible, deceptive, or embarrassing position.

2. METHODOLOGY INTEGRITY VS. DOMAIN INTEGRITY (TRANSFERABLE SKILLS):
   - Highlight transferable methodologies, problem topologies, architectural patterns, and operational rigor (e.g., anomaly detection, behavioral segmentation, high-velocity streaming pipelines, cross-functional stakeholder leadership, SLA-critical systems).
   - STRICT PROHIBITION: NEVER retroactively falsify or rebrand past projects with the target industry's domain, regulatory framework, or compliance terminology if the candidate did not actually work in that domain.
   - Example of what NOT to do: DO NOT rebrand customer churn, user retention, or flight-risk models as "AML / Financial Crime Compliance", "Fraud Detection", or "Proactive Risk Mitigation".
   - Correct approach: Accurately state the original problem domain (e.g., "Built predictive classification and behavioral segmentation models on high-volume user event streams"), framing the underlying mathematical, algorithmic, and engineering capability without claiming domain expertise they do not possess.

3. STRICT PROHIBITION ON INFLATED BUZZWORDS & PUFFERY:
   - Ban hollow corporate buzzwords, superlative hype, and inflated titles such as: "enterprise-grade", "enterprise-scale", "architected" (where the actual work was building, fine-tuning, or deploying models), "intelligent automation", "cutting-edge", "world-class", "groundbreaking", "spearheaded revolution", or "visionary".
   - Use grounded, calibrated, high-credibility action verbs: "Built", "Designed", "Implemented", "Trained", "Deployed", "Led", "Streamlined", "Optimized", "Scaled", "Automated".
   - Maintain the voice of a seasoned, credible PMET: concise, precise, substance-over-fluff, and modest yet impactful.

4. TENURE & TIMELINE ACCURACY (NO CONFLATION):
   - Never conflate total career tenure with specialized discipline or tooling tenure.
   - Example of what NOT to do: If a candidate has 20 years in software engineering but began building production ML models in 2016, NEVER write "20+ years building and shipping ML systems."
   - Correct approach: Accurately distinguish overall career seniority from specific domain experience (e.g., "Senior engineering leader with 20+ years of software delivery experience, including 8+ years designing and deploying production ML systems").

5. PRESERVATION OF METRICS & FACTS:
   - Maintain all original facts, dates, companies, roles, and educational credentials—do not hallucinate or invent new roles, companies, or credentials.
   - Preserve all real metrics, numbers, and team sizes from the master resume.
   - Never invent or fabricate metrics, percentages, dollar figures, or impact numbers that were not present in the master resume. If an accomplishment lacks numbers, focus on the concrete output and structural impact rather than fabricating statistics.

6. HONEST ATS & KEYWORD ALIGNMENT:
   - Naturally weave in target role keywords where genuine functional overlaps exist (e.g., high-throughput pipelines, distributed computing, stakeholder management, Python, cloud architecture).
   - If the job description requires specialized domain regulations or certifications the candidate genuinely lacks (e.g., CAMS, KYC/AML regulatory reporting, Basel III, Series 7, HIPAA), DO NOT inject them into the resume text. Let the ATS gap analysis and JD Deflator capture them honestly so the candidate is prepared.

============================================================
REQUIRED DELIVERABLES:
============================================================

1. Tailored Resume:
   - Generate the tailored resume in clean, professional markdown format, adhering strictly to all 6 Guardrails above.

2. ATS Keyword Matching & Gap Analysis:
   - Calculate estimated ATS match score (0-100) for BOTH the original master resume (before) and the tailored resume (after).
   - Identify matching keywords, missing keywords, learning actions, and transferable skills (with original phrasing, tailored phrasing, and an explanation of the translation).

3. Career Coach Evaluation:
   - Evaluate alignment score (0-100) between the original master resume and the target JD.
   - Provide three clean arrays of strings (no leading dashes or numbers):
     (a) strengths: Top transferable strengths and areas of authentic alignment.
     (b) gaps: Structural, domain, experience, or skill gaps they genuinely face.
     (c) suggestions: Strategic, actionable coaching suggestions and positioning recommendations to bridge those gaps honestly.

4. JD Deflator Analysis (4-Layer Recruiter Heuristic Model):
   - Layer 1 (Structural Cues): Minimum/Basic Qualifications vs Preferred/Bonus Qualifications.
   - Layer 2 (Linguistic Modality): Obligatory language ("must have", "required", "5+ years") vs flexible language ("nice to have", "plus", "familiarity with").
   - Layer 3 (Learnability Horizon): Core foundational capabilities (6+ months) vs interchangeable tool syntax/libraries (learnable in 1-2 weeks on the job).
   - Layer 4 (Centrality): Core daily deliverables vs peripheral requirements.
   - Identify 3 to 6 true "mustHaves" (dealbreakers) with match status, recruiter rationale, and candidate evidence.
   - Identify 3 to 6 "goodToHaves" (wishlist/learnable) with match status, recruiter rationale, and substitute advice.
   - Calculate mustHavesMatchRate (0-100) and goodToHavesMatchRate (0-100).
   - Provide a confidence-boosting, realistic recruiter "verdict" string.

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
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tailoredResume: {
              type: Type.STRING,
              description: 'The fully tailored resume in clean, professional markdown format. Must be strictly factual, calibrated for high PMET credibility, free of buzzword inflation, and 100% defensible in an interview.',
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

    let cleanedJson = responseText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(cleanedJson);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Tailoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor CV' },
      { status: 500 }
    );
  }
}
