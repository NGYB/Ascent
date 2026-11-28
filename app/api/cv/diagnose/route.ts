import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { CvDiagnosis } from '@/lib/cv-diagnosis';

export const maxDuration = 60;

// Deterministic rubric scoring based on concrete text metrics
function calculateDeterministicRubricScores(text: string): {
  quantifiedImpact: number;
  actionVerbs: number;
  structureParsability: number;
  competencyDepth: number;
  overallScore: number;
  metricRatioPct: number;
  quantifiedCount: number;
  totalBullets: number;
  passiveCount: number;
  hasExp: boolean;
  hasEdu: boolean;
  hasSkills: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*') || /^\d+[\.\)]/.test(l));
  
  // 1. Quantified Metrics: numbers with %, $, k, M, headcount, time saved, metrics
  const metricRegex = /(\d+[%$kKmMbB]|\$\d+|\d+\+|\b\d+\s*(percent|users|clients|team|million|thousand|billion|hours|days|weeks|months|years|members|stakeholders)\b)/i;
  const quantifiedCount = bullets.filter(b => metricRegex.test(b)).length;
  const totalBullets = Math.max(bullets.length, 5);
  const metricRatioPct = Math.round((quantifiedCount / totalBullets) * 100);

  // Score 1: Quantified Impact (35% weight)
  // 0% metrics -> ~35, 30% metrics -> ~65, 60%+ metrics -> 88-95
  const quantifiedImpact = Math.min(95, Math.max(30, Math.round(35 + metricRatioPct * 0.95)));

  // 2. Action Verbs: check for passive duty phrases vs executive power verbs
  const passiveRegex = /\b(responsible for|helped with|assisted with|tasked with|worked on|duties included|participated in|handled)\b/i;
  const passiveCount = bullets.filter(b => passiveRegex.test(b)).length;
  
  const powerVerbRegex = /\b(spearheaded|architected|accelerated|orchestrated|negotiated|engineered|championed|delivered|transformed|generated|optimized|streamlined|formulated|executed|directed|led|founded)\b/i;
  const powerVerbCount = bullets.filter(b => powerVerbRegex.test(b)).length;

  // Score 2: Action Verbs & Phrasing (25% weight)
  let verbScore = 75 - (passiveCount * 8) + Math.min(powerVerbCount * 4, 20);
  const actionVerbs = Math.min(95, Math.max(35, Math.round(verbScore)));

  // 3. Structure & Parsability (20% weight)
  const hasExp = /experience|work history|employment|career history/i.test(text);
  const hasEdu = /education|university|degree|bachelor|master|diploma/i.test(text);
  const hasSkills = /skills|technologies|proficiencies|competencies|tools/i.test(text);
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/.test(text);

  const structureScore = 
    (hasExp ? 25 : 0) + 
    (hasEdu ? 25 : 0) + 
    (hasSkills ? 25 : 0) + 
    (hasEmail ? 15 : 0) + 
    (hasPhone ? 10 : 0);
  const structureParsability = Math.min(100, Math.max(30, structureScore));

  // 4. Competency & Seniority Depth (20% weight)
  // Evaluates length, breadth of vocabulary, and categorised skills
  const categorizedSkillHeaders = /technical skills|core competencies|leadership|methodologies|certifications/i.test(text);
  let compScore = 60 + (categorizedSkillHeaders ? 15 : 5) + Math.min(Math.round(lines.length / 4), 20);
  const competencyDepth = Math.min(95, Math.max(40, compScore));

  // Overall baseline ATS score (weighted combination)
  const overallScore = Math.round(
    0.35 * quantifiedImpact +
    0.25 * actionVerbs +
    0.20 * structureParsability +
    0.20 * competencyDepth
  );

  return {
    quantifiedImpact,
    actionVerbs,
    structureParsability,
    competencyDepth,
    overallScore: Math.min(95, Math.max(35, overallScore)),
    metricRatioPct,
    quantifiedCount,
    totalBullets,
    passiveCount,
    hasExp,
    hasEdu,
    hasSkills,
    hasEmail,
    hasPhone
  };
}

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
    const rubric = calculateDeterministicRubricScores(trimmedText);
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback heuristic diagnosis if Gemini API key is unconfigured
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      const fallback = computeFallbackDiagnosis(trimmedText, rubric);
      return NextResponse.json({ diagnosis: fallback, isDemo: true });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an executive talent recruitment director and resume doctor specializing in mid-career PMET hiring standards.
Perform a clinical, candid, and constructive "Doctor's Visit" diagnosis on this candidate's Master CV.
The candidate has NOT selected a target job yet; you are diagnosing the foundational ATS readiness and hiring hygiene of their general resume.

The candidate's resume has already been evaluated using our deterministic 4-pillar ATS parser engine with the following exact baseline metrics:
- Overall Baseline ATS Health: ${rubric.overallScore}/100
- 1. Quantified Impact Pillar: ${rubric.quantifiedImpact}/100 (${rubric.metricRatioPct}% quantified bullets, ${rubric.quantifiedCount} of ${rubric.totalBullets} bullets with numbers/scale)
- 2. Action Verbs Pillar: ${rubric.actionVerbs}/100 (${rubric.passiveCount} passive duty phrases identified)
- 3. ATS Structure & Parsability Pillar: ${rubric.structureParsability}/100 (Work Experience: ${rubric.hasExp}, Education: ${rubric.hasEdu}, Skills Section: ${rubric.hasSkills}, Contact Info: ${rubric.hasEmail})
- 4. Competency & Seniority Signal Depth: ${rubric.competencyDepth}/100

============================================================
Input Master CV:
"""
${trimmedText.slice(0, 7000)}
"""
============================================================

Your task is to provide the clinical qualitative appraisal matching these pillar scores:
1. verdict: Exactly 1 to 2 sentences delivering a candid, empathetic "doctor's diagnosis" of the CV's core state and hiring readiness.
2. topIssues: Exactly 3 highest-priority recommendations, ordered from most critical to least. Each must have:
   - id: "issue-1", "issue-2", "issue-3"
   - pillar: one of "Quantified Impact", "Action Verbs & Phrasing", "ATS Structure & Parsability", "Competency & Seniority Depth"
   - severity: "critical", "warning", or "recommendation"
   - title: short punchy title (e.g. "Severe Metric Deficit in Work History")
   - diagnosis: specific evidence found in this CV (cite concrete bullet examples or patterns)
   - prescription: concrete actionable advice on how to rewrite or fix it (e.g. "Add percentage efficiency gains, team size, or budget scope using the Google XYZ formula")
3. strengths: Exactly 2 genuine positive highlights found in this CV.

Ensure the output is clear and practical for jobseekers without confusing medical jargon or shorthand like 'Rx'.
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
              verdict: {
                type: Type.STRING,
                description: 'A 1-2 sentence candid doctor verdict on the resume.'
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
            required: ['verdict', 'topIssues', 'strengths']
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

        const diagnosis: CvDiagnosis = {
          baselineScore: rubric.overallScore,
          verdict: parsed.verdict || (
            rubric.metricRatioPct < 40
              ? `Solid career foundation, but bullet points read like job descriptions rather than business achievements with only ${rubric.metricRatioPct}% of bullets quantified.`
              : `Well-structured resume with healthy baseline metrics; sharpening executive power verbs and skill categorization will maximize recruiter appeal.`
          ),
          metricRatio: `${rubric.metricRatioPct}% of bullets quantified (${rubric.quantifiedCount} of ${rubric.totalBullets})`,
          pillarScores: {
            quantifiedImpact: rubric.quantifiedImpact,
            actionVerbs: rubric.actionVerbs,
            structureParsability: rubric.structureParsability,
            competencyDepth: rubric.competencyDepth
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
      const fallback = computeFallbackDiagnosis(trimmedText, rubric);
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
function computeFallbackDiagnosis(text: string, rubric: ReturnType<typeof calculateDeterministicRubricScores>): CvDiagnosis {
  const {
    quantifiedImpact,
    actionVerbs,
    structureParsability,
    competencyDepth,
    overallScore,
    metricRatioPct,
    quantifiedCount,
    totalBullets,
    passiveCount,
    hasExp,
    hasEdu,
    hasEmail
  } = rubric;

  return {
    baselineScore: overallScore,
    verdict: metricRatioPct < 40 
      ? `Solid professional history, but achievements read like job duties rather than measurable business outcomes with only ${metricRatioPct}% of bullets quantified.`
      : `Promising resume structure with good baseline metrics, with opportunities to sharpen executive power phrasing and skills indexing.`,
    metricRatio: `${metricRatioPct}% of bullets quantified (${quantifiedCount} of ${totalBullets})`,
    pillarScores: {
      quantifiedImpact,
      actionVerbs,
      structureParsability,
      competencyDepth
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
