import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, jobDescription, tailoredResumeText } = await req.json();

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing question or userAnswer' },
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
You are an expert interviewer and career coach.
Provide constructive feedback on the user's answer to the following interview question.

Question:
"${question}"

User's Answer:
"${userAnswer}"

Job Context (if provided):
"""
${jobDescription || 'N/A'}
"""

Candidate Resume context (if provided):
"""
${tailoredResumeText || 'N/A'}
"""

Evaluate the answer. Score it out of 100.
Identify exactly what they did well (strengths) and specific areas of improvement (e.g. using the STAR method, adding metrics, clarifying scope).

Provide a "suggestedAnswer" demonstrating how they could write a polished, professional, high-scoring exemplar response to this question utilizing their resume credentials where applicable.

CRITICAL FORMATTING INSTRUCTIONS FOR "suggestedAnswer":
- The response MUST be formatted in clean Markdown with clear section headers and separate, readable paragraphs. It must NEVER be output as a single unbroken wall or block of text.
- If this is a behavioral or situational question, organize it into the STAR framework with markdown section headers:
  ### Situation & Context
  [Set the scene, background context, and specific challenge in 1-2 focused paragraphs]

  ### Action Taken
  [Detail the strategic actions, ownership, cross-functional collaboration, and technical/operational execution in 1-2 focused paragraphs]

  ### Measurable Result & Impact
  [Quantify business impact, metrics, efficiencies, revenue, or team outcomes achieved]

  ### Key Strategic Takeaway
  [1-2 concluding sentences highlighting leadership philosophy, learnings, or transferable value]

- If this is a technical, domain, or strategic question, organize it logically with markdown section headers:
  ### Core Strategy & Framework
  [Conceptual foundation, principles, or approach in 1-2 focused paragraphs]

  ### Practical Execution & Implementation
  [Specific steps, tools, risk mitigation, and workflows in 1-2 focused paragraphs]

  ### Impact & Business Trade-offs
  [Long-term outcomes, governance, scalability, and measurable results]

- Always use double line breaks (\n\n) between paragraphs and section headings to ensure clean visual spacing and readability.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Score out of 100.' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Points the user articulated well.'
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific advice for improving their answer (e.g. using STAR, adding metrics).'
            },
            suggestedAnswer: {
              type: Type.STRING,
              description: 'An exemplar rewritten answer formatted in clean Markdown with distinct section headers (e.g. ### Situation & Context, ### Action Taken, ### Measurable Result & Impact) and separate paragraphs separated by double line breaks.'
            }
          },
          required: ['score', 'strengths', 'improvements', 'suggestedAnswer']
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Interview feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade interview response' },
      { status: 500 }
    );
  }
}
