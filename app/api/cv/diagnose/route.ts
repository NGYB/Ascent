import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { CvDiagnosis } from '@/lib/cv-diagnosis';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return NextResponse.json(
        { error: 'Please provide valid resume text for diagnosis.' },
        { status: 400 }
      );
    }

    const trimmedText = resumeText.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback heuristic diagnosis if Gemini API key is unconfigured
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      const fallback = computeFallbackDiagnosis(trimmedText);
      return NextResponse.json({ diagnosis: fallback, isDemo: true });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an executive talent recruitment director and resume doctor specializing in mid-career PMET hiring standards.
Perform a clinical, candid, and constructive "Doctor's Visit" diagnosis on this candidate's Master CV.
The candidate has NOT selected a target job yet; you are diagnosing the foundational ATS readiness and hiring hygiene of their general resume.

Evaluate the CV strictly across the 4 Diagnostic Pillars:
1. QUANTIFIED IMPACT (Weight: 35%):
   - Check if bullet points use the Google XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]").
   - Calculate what percentage of bullet points actually contain metrics (%, $, headcount, scale, time saved).
   - Flag if the resume merely lists daily duties ("Responsible for managing operations") instead of business outcomes.

2. ACTION VERBS & EXECUTIVE PHRASING (Weight: 25%):
   - Check for decisive power verbs (e.g. Architected, Spearheaded, Accelerated, Negotiated).
   - Penalize passive, junior phrasing ("Assisted with", "Handled", "Helped", "Worked on").
   - Penalize overused filler buzzwords ("results-driven team player", "go-getter").

3. ATS STRUCTURE & PARSABILITY (Weight: 20%):
   - Check for standard, parseable section headers (Experience, Education, Skills, Contact).
   - Check chronological integrity and date clarity.
   - Check complete contact information.

4. COMPETENCY & SENIORITY SIGNAL DEPTH (Weight: 20%):
   - Check if technical, management, and domain skills are categorized meaningfully or dumped as an unformatted block.
   - Check if the vocabulary conveys appropriate senior-level authority.

============================================================
Input Master CV:
"""
${trimmedText.slice(0, 7000)}
"""
============================================================

Instructions for Response:
- baselineScore: Calculate an honest integer (0-100) using the weighted formula: (0.35 * quantifiedImpact) + (0.25 * actionVerbs) + (0.20 * structureParsability) + (0.20 * competencyDepth).
- verdict: Exactly 1 to 2 sentences delivering a candid, empathetic "doctor's diagnosis" of the CV's core state.
- metricRatio: A short string estimating quantified bullets (e.g., "25% of bullets quantified" or "3 of 12 bullets have metrics").
- topIssues: Exactly 3 highest-priority clinical prescriptions, ordered from most critical to least. Each must have:
  - id: "issue-1", "issue-2", "issue-3"
  - pillar: one of "Quantified Impact", "Action Verbs & Phrasing", "ATS Structure & Parsability", "Competency & Seniority Depth"
  - severity: "critical", "warning", or "recommendation"
  - title: short punchy title (e.g. "Severe Metric Deficit in Work History")
  - diagnosis: specific evidence found in this CV (e.g. "8 of your 11 experience bullets lack numbers or scale indicators")
  - prescription: concrete actionable advice on how to rewrite or fix it (e.g. "Add percentage efficiency gains, team size, or budget scope")
- strengths: Exactly 2 genuine positive highlights found in this CV.
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
              baselineScore: {
                type: Type.INTEGER,
                description: 'Overall weighted baseline ATS health score from 0 to 100.'
              },
              verdict: {
                type: Type.STRING,
                description: 'A 1-2 sentence candid doctor verdict on the resume.'
              },
              metricRatio: {
                type: Type.STRING,
                description: 'Percentage or ratio of quantified bullets (e.g. "20% of bullets quantified").'
              },
              pillarScores: {
                type: Type.OBJECT,
                properties: {
                  quantifiedImpact: { type: Type.INTEGER, description: 'Score from 0 to 100 on metrics & business outcomes (35% weight).' },
                  actionVerbs: { type: Type.INTEGER, description: 'Score from 0 to 100 on power verbs & assertive phrasing (25% weight).' },
                  structureParsability: { type: Type.INTEGER, description: 'Score from 0 to 100 on section headers & ATS parsability (20% weight).' },
                  competencyDepth: { type: Type.INTEGER, description: 'Score from 0 to 100 on skills depth & seniority signaling (20% weight).' }
                },
                required: ['quantifiedImpact', 'actionVerbs', 'structureParsability', 'competencyDepth']
              },
              topIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    pillar: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['critical', 'warning', 'recommendation'] },
                    title: { type: Type.STRING },
                    diagnosis: { type: Type.STRING },
                    prescription: { type: Type.STRING }
                  },
                  required: ['id', 'pillar', 'severity', 'title', 'diagnosis', 'prescription']
                },
                description: 'Exactly 3 priority issues diagnosed in the resume.'
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 2 genuine positive attributes of the resume.'
              }
            },
            required: ['baselineScore', 'verdict', 'metricRatio', 'pillarScores', 'topIssues', 'strengths']
          }
        }
      });

      if (response.text) {
        let cleaned = response.text.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned);

        // Ensure baselineScore is accurately weighted
        const calculatedScore = Math.round(
          0.35 * (parsed.pillarScores?.quantifiedImpact ?? 60) +
          0.25 * (parsed.pillarScores?.actionVerbs ?? 65) +
          0.20 * (parsed.pillarScores?.structureParsability ?? 75) +
          0.20 * (parsed.pillarScores?.competencyDepth ?? 70)
        );

        const diagnosis: CvDiagnosis = {
          baselineScore: Math.min(95, Math.max(35, parsed.baselineScore || calculatedScore)),
          verdict: parsed.verdict || 'Your CV demonstrates solid baseline competence, but lacks the quantified business outcomes necessary to stand out in competitive ATS rankings.',
          metricRatio: parsed.metricRatio || 'Under 30% of bullets quantified',
          pillarScores: {
            quantifiedImpact: Math.min(100, Math.max(20, parsed.pillarScores?.quantifiedImpact ?? 55)),
            actionVerbs: Math.min(100, Math.max(20, parsed.pillarScores?.actionVerbs ?? 65)),
            structureParsability: Math.min(100, Math.max(20, parsed.pillarScores?.structureParsability ?? 80)),
            competencyDepth: Math.min(100, Math.max(20, parsed.pillarScores?.competencyDepth ?? 70))
          },
          topIssues: (parsed.topIssues || []).slice(0, 3),
          strengths: (parsed.strengths || []).slice(0, 2),
          diagnosedAt: new Date().toISOString()
        };

        return NextResponse.json({ diagnosis, isDemo: false });
      }

      throw new Error('Gemini returned an empty diagnosis response.');

    } catch (aiErr: any) {
      console.warn('Gemini diagnosis failed, using heuristic fallback:', aiErr);
      const fallback = computeFallbackDiagnosis(trimmedText);
      return NextResponse.json({ diagnosis: fallback, isDemo: true, notice: 'Computed via local ATS heuristic engine.' });
    }

  } catch (error: any) {
    console.error('CV diagnosis route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during CV diagnosis' },
      { status: 500 }
    );
  }
}

// Deterministic heuristic fallback when Gemini API key is missing or offline
function computeFallbackDiagnosis(text: string): CvDiagnosis {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*') || /^\d+\./.test(l));
  
  // 1. Metric check
  const metricRegex = /(\d+[%$kKmMbB]|\$\d+|\d+\+|\b\d+\s*(percent|users|clients|team|million|thousand|billion|hours|days|weeks|months|years)\b)/i;
  const quantifiedCount = bullets.filter(b => metricRegex.test(b)).length;
  const totalBullets = Math.max(bullets.length, 6);
  const metricRatioPct = Math.round((quantifiedCount / totalBullets) * 100);
  
  // 2. Passive verb check
  const passiveRegex = /\b(responsible for|helped with|assisted with|tasked with|worked on|duties included)\b/i;
  const passiveCount = bullets.filter(b => passiveRegex.test(b)).length;

  // 3. Structure check
  const hasExp = /experience|work history|employment/i.test(text);
  const hasEdu = /education|university|degree|bachelor|master/i.test(text);
  const hasSkills = /skills|technologies|proficiencies|competencies/i.test(text);
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);

  // Scores
  const impactScore = Math.min(95, Math.max(30, Math.round(metricRatioPct * 1.2 + 30)));
  const verbScore = Math.max(40, Math.min(90, 85 - passiveCount * 12));
  const structureScore = (hasExp ? 25 : 0) + (hasEdu ? 25 : 0) + (hasSkills ? 25 : 0) + (hasEmail ? 25 : 0);
  const competencyScore = Math.min(90, Math.max(45, 55 + Math.min(lines.length / 5, 30)));

  const baselineScore = Math.round(
    0.35 * impactScore + 0.25 * verbScore + 0.20 * structureScore + 0.20 * competencyScore
  );

  return {
    baselineScore: Math.min(92, Math.max(45, baselineScore)),
    verdict: metricRatioPct < 40 
      ? `Solid professional history, but achievements read like job duties rather than measurable business outcomes with only ${metricRatioPct}% of bullets quantified.`
      : `Promising resume structure with good baseline metrics, with opportunities to sharpen executive power phrasing and skills indexing.`,
    metricRatio: `${metricRatioPct}% of bullets quantified (${quantifiedCount} of ${totalBullets})`,
    pillarScores: {
      quantifiedImpact: impactScore,
      actionVerbs: verbScore,
      structureParsability: structureScore,
      competencyDepth: Math.round(competencyScore)
    },
    topIssues: [
      {
        id: 'issue-1',
        pillar: 'Quantified Impact & XYZ Formula',
        severity: metricRatioPct < 35 ? 'critical' : 'warning',
        title: metricRatioPct < 35 ? 'Severe Metric Deficit in Work History' : 'Inconsistent Metric Quantifiers',
        diagnosis: `${totalBullets - quantifiedCount} of your ${totalBullets} experience bullets lack concrete metrics (% gains, dollar volume, team scale, or time saved).`,
        prescription: 'Apply the Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]" to clearly demonstrate business outcomes.'
      },
      {
        id: 'issue-2',
        pillar: 'Action Verbs & Executive Phrasing',
        severity: passiveCount > 0 ? 'warning' : 'recommendation',
        title: passiveCount > 0 ? 'Passive Duty Phrasing Detected' : 'Elevate to Executive Power Verbs',
        diagnosis: passiveCount > 0 
          ? `Detected ${passiveCount} bullet(s) utilizing passive duty phrases (e.g. "Responsible for", "Assisted with").`
          : 'Several bullets rely on standard operational verbs rather than senior executive leadership verbs.',
        prescription: 'Replace passive phrases with high-conviction verbs like "Spearheaded", "Architected", "Accelerated", or "Orchestrated".'
      },
      {
        id: 'issue-3',
        pillar: 'Competency & Seniority Signal Depth',
        severity: 'recommendation',
        title: 'Skills Indexing Structure',
        diagnosis: 'Skills and technical proficiencies could be grouped more systematically to improve enterprise ATS search indexation.',
        prescription: 'Cluster skills into distinct subcategories: Core Domain Leadership, Technical Stack, and Methodologies.'
      }
    ],
    strengths: [
      hasExp && hasEdu ? 'Standard reverse-chronological trajectory with clear educational credentials' : 'Clear professional domain trajectory',
      hasEmail ? 'Complete contact information with parseable email identity' : 'Recognizable industry experience'
    ],
    diagnosedAt: new Date().toISOString()
  };
}
