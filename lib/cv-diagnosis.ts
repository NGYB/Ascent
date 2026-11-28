export interface DiagnosticPillarInfo {
  id: 'impact' | 'verbs' | 'structure' | 'competency';
  title: string;
  weight: number;
  subtitle: string;
  description: string;
  whatWeLookFor: string[];
  whyItMatters: string;
}

export const DIAGNOSTIC_PILLARS: DiagnosticPillarInfo[] = [
  {
    id: 'impact',
    title: 'Quantified Impact & XYZ Formula',
    weight: 35,
    subtitle: 'Measurable business outcomes over generic duties',
    description: 'Hiring managers and modern ATS ranking algorithms reward concrete evidence of business outcomes. Every strong accomplishment bullet should answer: What did you do? How was it measured? What was the business impact?',
    whatWeLookFor: [
      'Percentage growth, efficiency improvements, or cost reductions (% metric)',
      'Dollar values, budget ownership, or revenue generated ($ metric)',
      'Team headcounts, user bases, or technical volume scale (# metric)',
      'Google-standard XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]"'
    ],
    whyItMatters: 'Candidates with >50% quantified bullets receive up to 3.2x more recruiter callbacks than resumes that merely list job duties.'
  },
  {
    id: 'verbs',
    title: 'Action Verbs & Executive Phrasing',
    weight: 25,
    subtitle: 'Authoritative leadership verbs over passive tasks',
    description: 'Evaluates the assertiveness and credibility of your vocabulary. Weak, passive phrases ("Responsible for", "Helped with", "Assisted") signal execution without ownership and dilute your seniority.',
    whatWeLookFor: [
      'Strong executive power verbs (e.g., Architected, Spearheaded, Accelerated, Negotiated)',
      'Elimination of passive duty markers ("Responsible for managing", "Duties included")',
      'Absence of overused resume buzzwords ("hardworking team player", "go-getter")'
    ],
    whyItMatters: 'Recruiters spend 6–8 seconds on initial visual screening. Anchoring every bullet with a decisive power verb establishes immediate professional authority.'
  },
  {
    id: 'structure',
    title: 'ATS Structure & Parsability',
    weight: 20,
    subtitle: 'Clean section headers and parsing readability',
    description: 'Applicant Tracking Systems (Taleo, Workday, Greenhouse) extract and index resume text into candidate database fields. Multi-column tables, missing headers, or ambiguous dates can corrupt your profile.',
    whatWeLookFor: [
      'Standard recognizable section headings (Work Experience, Education, Skills)',
      'Chronological date integrity (e.g. Month Year – Month Year)',
      'Complete contact information (Email, Phone, LinkedIn / City)',
      'Absence of unparseable formatting traps or corrupted character artifacts'
    ],
    whyItMatters: 'Up to 30% of resumes encounter parsing errors in enterprise ATS filters before a hiring manager ever sees them.'
  },
  {
    id: 'competency',
    title: 'Competency & Seniority Signal Depth',
    weight: 20,
    subtitle: 'Hard skill clustering and industry terminology',
    description: 'Measures whether your CV projects a cohesive professional identity with recognized industry tools, frameworks, and methodologies rather than an undifferentiated keyword dump.',
    whatWeLookFor: [
      'Categorized skills presentation (Core Competencies, Technical Stack, Methodologies)',
      'Recognized industry frameworks and tools (e.g., Agile, CI/CD, SQL, Stakeholder Management)',
      'Consistent seniority signaling matching Professional, Managerial, or Executive levels'
    ],
    whyItMatters: 'ATS parsers assign higher relevance to skills contextualized within structured domains rather than random keywords thrown at the end of a resume.'
  }
];

export interface DiagnosisIssue {
  id: string;
  pillar: string;
  severity: 'critical' | 'warning' | 'recommendation';
  title: string;
  diagnosis: string;
  prescription: string;
}

export interface PillarScoreBreakdown {
  quantifiedImpact: number;
  actionVerbs: number;
  structureParsability: number;
  competencyDepth: number;
}

export interface CvDiagnosis {
  baselineScore: number;
  verdict: string;
  metricRatio: string;
  pillarScores: PillarScoreBreakdown;
  topIssues: DiagnosisIssue[];
  strengths: string[];
  diagnosedAt: string;
}

export const STORAGE_KEY_CV_DIAGNOSIS = 'ascent_cv_diagnosis';
