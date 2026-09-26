'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  ChevronsUp,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle,
  Radar
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    hasResume: false,
    resumeName: '',
    tailoredCount: 0,
    applicationsCount: 0
  });

  useEffect(() => {
    // Read stats from localStorage
    const resumeText = localStorage.getItem('ascent_master_resume');
    const resumeName = localStorage.getItem('ascent_resume_name') || 'cv.pdf';
    
    let tailoredCount = 0;
    try {
      const tailored = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      tailoredCount = tailored.length;
    } catch {}

    let applicationsCount = 0;
    try {
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      applicationsCount = apps.length;
    } catch {}

    setStats({
      hasResume: !!resumeText,
      resumeName: resumeName,
      tailoredCount,
      applicationsCount
    });
  }, []);

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-pine-950 via-pine-900 to-pine-950 text-white rounded-2xl p-8 shadow-sm border border-pine-850/80 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <ChevronsUp className="h-64 w-64 text-terracotta-400" />
        </div>
        <div className="max-w-2xl space-y-4">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-terracotta-500/20 text-terracotta-300 border border-terracotta-500/35 rounded-full">
            Mid-Career Career Accelerator
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-sand-50">
            Land your next transition with Ascent.
          </h2>
          <p className="text-sand-200 text-base sm:text-lg leading-relaxed">
            Ascent uses AI to dynamically adapt your career experience to target roles. Tailor CVs for ATS validation, analyze skill gaps, and run mock interviews trained specifically on your profile.
          </p>
        </div>
      </div>

      {/* Privacy Alert Info Box */}
      <div className="bg-pine-50 border border-pine-200/80 p-4 rounded-xl flex items-start justify-between gap-3.5 text-sm text-pine-900 max-w-3xl flex-wrap sm:flex-nowrap shadow-2xs">
        <div className="flex items-start gap-3.5">
          <AlertCircle className="h-5 w-5 text-pine-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Privacy First:</span> All session data is kept strictly inside your browser&apos;s local storage—we never store any of your files or personal data on our servers.
          </div>
        </div>
        <Link 
          href="/faq"
          className="text-xs font-bold text-pine-800 hover:text-terracotta-700 underline whitespace-nowrap self-center sm:self-auto flex-shrink-0 transition-colors"
        >
          Privacy & AI FAQ →
        </Link>
      </div>

      {/* Quick Stats / Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-pine-50 flex items-center justify-center text-pine-700 border border-pine-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Master CV</p>
            <p className="text-lg font-bold text-ink-900">
              {stats.hasResume ? stats.resumeName : 'Not Uploaded'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-terracotta-50 flex items-center justify-center text-terracotta-600 border border-terracotta-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Tailored CVs</p>
            <p className="text-lg font-bold text-ink-900">{stats.tailoredCount} versions</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sand-100 flex items-center justify-center text-ink-700 border border-sand-200">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Applications Tracked</p>
            <p className="text-lg font-bold text-ink-900">{stats.applicationsCount} active</p>
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-ink-900 px-1">Jump Right In</h3>
        <div className="flex flex-col gap-4">
          {/* Card 1: CV Workspace */}
          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs hover:shadow-xs hover:border-sand-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-pine-50 border border-pine-100 flex items-center justify-center text-pine-700 flex-shrink-0 mt-1">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-ink-900">1. CV Workspace</h4>
                <p className="text-sm text-ink-500 leading-relaxed max-w-2xl">
                  Upload your master PDF/Word CV. We'll parse the content so it's ready for real-time tailoring. You can preview and edit the raw text at any time.
                </p>
              </div>
            </div>
            <Link 
              href="/cv" 
              className="flex items-center gap-2 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors group-hover:gap-3 flex-shrink-0 self-end sm:self-center cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Smart Job Radar */}
          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs hover:shadow-xs hover:border-sand-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-terracotta-50 border border-terracotta-100 flex items-center justify-center text-terracotta-600 flex-shrink-0 mt-1">
                <Radar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-ink-900">2. Smart Job Radar</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-50 text-terracotta-700 border border-terracotta-200 uppercase">New</span>
                </div>
                <p className="text-sm text-ink-500 leading-relaxed max-w-2xl">
                  Scan active job postings across LinkedIn, Indeed, Greenhouse, and Google Jobs with SerpAPI. Get instant AI fit scoring against your Master CV and 1-click tailoring.
                </p>
              </div>
            </div>
            <Link 
              href="/radar" 
              className="flex items-center gap-2 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors group-hover:gap-3 flex-shrink-0 self-end sm:self-center cursor-pointer"
            >
              <span>Scan Radar</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 3: CV Tailoring & ATS */}
          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs hover:shadow-xs hover:border-sand-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-terracotta-50 border border-terracotta-100 flex items-center justify-center text-terracotta-600 flex-shrink-0 mt-1">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-ink-900">3. Tailor & ATS Scorecard</h4>
                <p className="text-sm text-ink-500 leading-relaxed max-w-2xl">
                  Enter a target job description. Our AI will automatically rewrite experience achievements, perform a keyword gap analysis, and output an ATS-optimized CV.
                </p>
              </div>
            </div>
            <Link 
              href="/tailor" 
              className="flex items-center gap-2 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors group-hover:gap-3 flex-shrink-0 self-end sm:self-center cursor-pointer"
            >
              <span>Start Tailoring</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 4: Interview Prep */}
          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs hover:shadow-xs hover:border-sand-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-pine-50 border border-pine-100 flex items-center justify-center text-pine-700 flex-shrink-0 mt-1">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-ink-900">4. Mock Interview Simulator</h4>
                <p className="text-sm text-ink-500 leading-relaxed max-w-2xl">
                  Practice answering customized behavioral and domain-specific questions tailored to your target role. Get immediate feedback, scores, and improved answers.
                </p>
              </div>
            </div>
            <Link 
              href="/interview" 
              className="flex items-center gap-2 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors group-hover:gap-3 flex-shrink-0 self-end sm:self-center cursor-pointer"
            >
              <span>Enter Prep Room</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 5: Job Tracker */}
          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-2xs hover:shadow-xs hover:border-sand-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-sand-100 border border-sand-200 flex items-center justify-center text-ink-700 flex-shrink-0 mt-1">
                <Kanban className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-ink-900">5. Application Tracker</h4>
                <p className="text-sm text-ink-500 leading-relaxed max-w-2xl">
                  Organize your job search. Keep track of which CV versions you sent to each position and manage interview stages with a simple Kanban pipeline.
                </p>
              </div>
            </div>
            <Link 
              href="/tracker" 
              className="flex items-center gap-2 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors group-hover:gap-3 flex-shrink-0 self-end sm:self-center cursor-pointer"
            >
              <span>View Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
