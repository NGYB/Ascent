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
Provide a "suggestedAnswer" demonstrating how they could write a polished, professional, high-scoring response to this question utilizing their resume credentials where applicable.
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
              description: 'An exemplar rewritten answer that demonstrates how to answer this question effectively using the candidate\'s background.'
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
