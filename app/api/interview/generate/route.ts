import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { tailoredResumeText, jobDescription } = await req.json();

    if (!tailoredResumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing tailoredResumeText or jobDescription' },
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
Analyze the user's tailored resume and target job description.
Generate exactly 5 highly relevant, role-specific interview questions.
Mix behavioral (e.g., situational, Star method) and technical/domain-specific questions.
Provide a helpful "hint" for each question that explains what a recruiter is looking for or how the user should frame their answer based on their resume.

Tailored Resume:
"""
${tailoredResumeText}
"""

Job Description:
"""
${jobDescription}
"""

Generate the questions with category and hints.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique slug or ID for the question, e.g. "q1", "q2".' },
                  text: { type: Type.STRING, description: 'The interview question text.' },
                  category: { 
                    type: Type.STRING, 
                    enum: ['behavioral', 'technical'],
                    description: 'The category of the interview question.' 
                  },
                  hint: { type: Type.STRING, description: 'Recruiter intent or advice on how to structure the response.' }
                },
                required: ['id', 'text', 'category', 'hint']
              }
            }
          },
          required: ['questions']
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
    console.error('Interview generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview questions' },
      { status: 500 }
    );
  }
}
