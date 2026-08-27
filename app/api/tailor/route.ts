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
5. As a world-class career coach, evaluate how aligned the target job description is to the user's background (the original master resume). Provide a career coach alignment score from 0 to 100 (where 100 represents a perfect fit). Structure your evaluation into three distinct fields, and write each as a clean bulleted list (using standard '-' bullets):
   (a) strengths: A list of their top transferable skills and areas of alignment.
   (b) gaps: A list of the structural, experience, or skill gaps they face.
   (c) suggestions: A list of strategic, actionable coaching suggestions and positioning recommendations to bridge those gaps.

Input Resume:
"""
${resumeText}
"""

Input Job Description:
"""
${jobDescription}
"""

Generate the tailored resume in clean markdown format, perform the ATS gap analysis, and provide the career coach evaluation.
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
                  type: Type.STRING,
                  description: 'Detailed analysis of the user\'s top transferable strengths and areas of alignment with the target role.'
                },
                gaps: {
                  type: Type.STRING,
                  description: 'Detailed analysis of the structural, experience, or skill gaps between the user\'s background and the target role.'
                },
                suggestions: {
                  type: Type.STRING,
                  description: 'Strategic suggestions, positioning advice, and coaching recommendations for bridging the gaps and tailoring their story.'
                }
              },
              required: ['alignmentScore', 'strengths', 'gaps', 'suggestions']
            }
          },
          required: ['tailoredResume', 'atsAnalysis', 'coachFeedback'],
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
