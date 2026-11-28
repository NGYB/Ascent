export type ChangelogCategory = 'feature' | 'improvement' | 'fix';
export type ChangelogSource = 'feedback' | 'roadmap';

export interface ChangelogItem {
  id: string;
  title: string;
  description: string;
  source: ChangelogSource;
  category: ChangelogCategory;
  feedbackQuote?: string; // Verbatim quote of the user feedback that inspired this change
  userCredit?: string;   // Label like "Candidate Feedback", "User Suggestion"
  tags?: string[];
}

export interface Release {
  version: string;
  stage?: string;
  releaseDate: string;
  title: string;
  summary: string;
  isLatest?: boolean;
  items: ChangelogItem[];
}

export const STORAGE_KEY_LAST_VIEWED_CHANGELOG = 'ascent_last_viewed_changelog_version';

export const CHANGELOG_RELEASES: Release[] = [
  {
    version: '0.2.3',
    stage: 'BETA',
    releaseDate: 'Nov 28, 2026',
    title: 'Clinical CV Diagnosis & Baseline ATS Health Score',
    summary: 'Introducing a comprehensive "Doctor\'s Visit" CV diagnosis before targeting roles, deterministic baseline ATS scoring across 4 methodology pillars, and continuous score boost tracking in Tailoring.',
    isLatest: true,
    items: [
      {
        id: 'cv-clinical-diagnosis',
        title: 'Doctor\'s Visit Clinical CV Diagnosis & Overall Verdict',
        description: 'Uploaded master resumes now receive an immediate clinical health check before any target roles are chosen. Delivers a candid 1–2 sentence doctor verdict, live metric bullet ratio (e.g. 42% quantified vs benchmark 60%+), foundational strengths, and prioritized prescriptions with clear severity tags (Critical Fix, Priority Action, Recommended Action).',
        source: 'feedback',
        category: 'feature',
        feedbackQuote: 'CV Workspace: give a diagnosis first, like a doctor\'s visit (overall verdict, top 3 issues). Also show my current ATS score as a baseline, so I can see the change after tailoring.',
        userCredit: 'User Feedback',
        tags: ['CV Workspace', 'ATS Health', 'Diagnosis']
      },
      {
        id: 'cv-scoring-methodology-pillars',
        title: '4 Diagnostic Pillars Methodology Modal',
        description: 'Complete transparency into how ATS health is calculated across 4 foundational pillars: Quantified Impact (35%), Action Verbs & Executive Phrasing (25%), ATS Structure & Parsability (20%), and Competency & Seniority Signal Depth (20%). Includes candidate-specific score breakdowns and actionable ATS rubrics.',
        source: 'roadmap',
        category: 'feature',
        tags: ['ATS Methodology', 'Transparency', 'Scoring']
      },
      {
        id: 'tailor-baseline-ats-boost',
        title: 'Baseline-to-Tailored ATS Score Progression',
        description: 'The Tailoring ATS Scorecard now displays a 3-score progression: Master CV Baseline Health → Original Job Match → Optimized Fit (+X% boost), allowing candidates to clearly visualize the exact score lift achieved after role-specific tailoring.',
        source: 'feedback',
        category: 'improvement',
        feedbackQuote: 'Also show my current ATS score as a baseline, so I can see the change after tailoring.',
        userCredit: 'User Feedback',
        tags: ['Tailoring', 'ATS Scorecard', 'Analytics']
      },
      {
        id: 'deterministic-scoring-and-clarity',
        title: 'Deterministic Score Stability & Clear Action Terminology',
        description: 'Engineered a deterministic text-parsing engine ensuring that clicking "Re-diagnose" maintains consistent baseline scores without AI sampling variance. Replaced confusing medical jargon ("Rx") with clear, standard action labels.',
        source: 'feedback',
        category: 'improvement',
        feedbackQuote: 'If the user clicks \'Re-diagnose\', the baseline ATS health should not change. Also, there is the words \'Priority RX\', or \'Recommended RX\' - what does RX mean here? Need to make it clearer',
        userCredit: 'User Feedback',
        tags: ['UX', 'Consistency', 'Scoring Engine']
      }
    ]
  },
  {
    version: '0.2.2',
    stage: 'BETA',
    releaseDate: 'Nov 26, 2026',
    title: 'User-Driven Safety & Multi-Portal Radar Expansion',
    summary: 'Directly addressing user feedback with active session auto-save on Tailor, persistent CV draft safety, and regional job aggregator sourcing.',
    items: [
      {
        id: 'tailor-autosave-draft',
        title: 'Active Session Auto-Save & Visible Save Action',
        description: 'Target job titles, descriptions, and AI-tailored CV results are now continuously persisted to local storage across page switches. Added visible "Save Tailored CV" buttons in the header, action bar, and CV preview, with unsaved changes warning banners and navigation guards.',
        source: 'feedback',
        category: 'improvement',
        feedbackQuote: 'Tailor page: make saving clearer. I lose my work when switching pages. A visible Save button and an unsaved-changes warning would help.',
        userCredit: 'User Feedback',
        tags: ['Tailoring', 'Data Safety', 'UX']
      },
      {
        id: 'radar-multi-portal-sourcing',
        title: 'Expanded Job Radar Sourcing (JobStreet, eFinancialCareers, MyCareersFuture)',
        description: 'Smart Job Radar now executes parallel targeted queries across JobStreet, eFinancialCareers, and MyCareersFuture alongside LinkedIn and Indeed. Postings are automatically deduplicated by title and employer with regional Singapore geo-locale hints.',
        source: 'feedback',
        category: 'feature',
        feedbackQuote: 'The aggregator feature across different job portals is useful. See if can include other popular job portals like JobStreet, efinancialcareers, MyCareersFuture',
        userCredit: 'User Feedback',
        tags: ['Job Radar', 'Aggregator', 'Singapore']
      },
      {
        id: 'transparent-changelog',
        title: 'Interactive Changelog with Community Feedback Attribution',
        description: 'Added a public changelog tracking product updates, specifically highlighting features shipped directly from user suggestions to show how candidate input shapes Ascent.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Platform', 'Community']
      }
    ]
  },
  {
    version: '0.2.1',
    stage: 'BETA',
    releaseDate: 'Nov 24, 2026',
    title: 'Scan First, Score After & Guardrail Defensibility',
    summary: 'Restructured the candidate onboarding journey around market exploration, client-side PDF extraction, and interview defensibility.',
    items: [
      {
        id: 'radar-scan-first-flow',
        title: 'Scan First, Score After (Radar Starting Point)',
        description: 'Candidates can now explore live market opportunities immediately without uploading a CV first. Clicking "Score with My CV" opens an in-place modal to calculate fit scores dynamically without leaving the search.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Radar', 'Onboarding', 'UX']
      },
      {
        id: 'client-pdf-extraction',
        title: 'Zero-Storage Client-Side PDF Extraction',
        description: 'Extracted PDF.js loader into a shared client-side utility for instant drag-and-drop parsing without uploading sensitive PDF files to external servers.',
        source: 'roadmap',
        category: 'improvement',
        tags: ['Privacy', 'PDF', 'Performance']
      },
      {
        id: 'anti-inflation-prompts',
        title: 'Interview Defensibility & Anti-Inflation Guardrails',
        description: 'Updated tailoring AI models with strict defensibility rules: preventing exaggerated metrics and grounding all tailored achievements in realistic, interview-ready phrasing.',
        source: 'roadmap',
        category: 'improvement',
        tags: ['Tailoring', 'AI Guardrails']
      }
    ]
  },
  {
    version: '0.2.0',
    stage: 'BETA',
    releaseDate: 'Nov 18, 2026',
    title: 'Foundational AI Career Suite',
    summary: 'The initial beta release of Ascent providing mid-career candidates with a privacy-first, local-only career acceleration platform.',
    items: [
      {
        id: 'smart-job-radar-core',
        title: 'Smart Job Radar with Google Jobs Aggregation',
        description: 'Aggregates live opportunities with real-time keyword relevance matching and fit score previews.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Radar']
      },
      {
        id: 'tailor-jd-deflator',
        title: 'Context-Aware CV Tailoring & JD Deflator',
        description: 'Breaks down job descriptions into recruiter must-haves vs. good-to-haves and restructures bullet points for maximum ATS alignment.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Tailoring', 'ATS']
      },
      {
        id: 'mock-interview-prep',
        title: 'Interactive Mock Interview Room',
        description: 'Generates targeted behavioral and situational interview questions with instant AI scoring and rubric breakdowns.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Interview']
      },
      {
        id: 'local-tracker-pipeline',
        title: '100% Local Application Pipeline & Data Manager',
        description: 'Full Kanban application tracking and data management with 100% browser-local storage, zero cloud tracking, and one-click data wipe.',
        source: 'roadmap',
        category: 'feature',
        tags: ['Privacy', 'Tracker']
      }
    ]
  }
];

export function getLatestRelease(): Release {
  return CHANGELOG_RELEASES[0];
}

export function hasUnreadChangelog(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const lastViewed = localStorage.getItem(STORAGE_KEY_LAST_VIEWED_CHANGELOG);
    const latest = getLatestRelease().version;
    return lastViewed !== latest;
  } catch {
    return false;
  }
}

export function markChangelogAsRead(): void {
  if (typeof window === 'undefined') return;
  try {
    const latest = getLatestRelease().version;
    localStorage.setItem(STORAGE_KEY_LAST_VIEWED_CHANGELOG, latest);
    window.dispatchEvent(new Event('ascent-changelog-read'));
  } catch {}
}
