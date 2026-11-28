'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Save,
  Radar,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  HelpCircle,
  Info,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { extractTextFromPdf } from '@/lib/pdf';
import { CvDiagnosis, STORAGE_KEY_CV_DIAGNOSIS } from '@/lib/cv-diagnosis';
import DiagnosticPillarsModal from '@/components/DiagnosticPillarsModal';

export default function CVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Diagnosis states
  const [diagnosis, setDiagnosis] = useState<CvDiagnosis | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);

  const loadStoredCV = () => {
    const savedText = localStorage.getItem('ascent_master_resume');
    const savedName = localStorage.getItem('ascent_resume_name');
    setResumeText(savedText || '');
    setResumeName(savedName || '');

    // Load saved diagnosis if available
    try {
      const savedDiagnosis = localStorage.getItem(STORAGE_KEY_CV_DIAGNOSIS);
      if (savedDiagnosis) {
        setDiagnosis(JSON.parse(savedDiagnosis));
      }
    } catch (e) {
      console.warn('Failed to parse stored CV diagnosis:', e);
    }
  };

  // Run diagnosis against resume text
  const runDiagnosis = async (text: string) => {
    if (!text || !text.trim()) return;

    setDiagnosing(true);
    setDiagnosisError('');

    try {
      const res = await fetch('/api/cv/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Diagnosis failed (${res.status})`);
      }

      const data = await res.json();
      if (data.diagnosis) {
        setDiagnosis(data.diagnosis);
        localStorage.setItem(STORAGE_KEY_CV_DIAGNOSIS, JSON.stringify(data.diagnosis));
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setDiagnosisError(err.message || 'Could not complete CV diagnosis. Click Re-run to try again.');
    } finally {
      setDiagnosing(false);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    loadStoredCV();
    window.addEventListener('ascent-storage-cleared', loadStoredCV);
    return () => window.removeEventListener('ascent-storage-cleared', loadStoredCV);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanedText = await extractTextFromPdf(file);
      setResumeText(cleanedText);
      setResumeName(file.name);
      try {
        localStorage.setItem('ascent_master_resume', cleanedText);
        localStorage.setItem('ascent_resume_name', file.name);
      } catch {}
      setSuccess('Master CV uploaded and saved! Running clinical ATS diagnosis...');
      setFile(null);

      // Automatically trigger diagnosis for the newly uploaded CV
      runDiagnosis(cleanedText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while parsing the PDF. Ensure it is a valid, text-based PDF file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = () => {
    localStorage.setItem('ascent_master_resume', resumeText);
    localStorage.setItem('ascent_resume_name', resumeName);
    setSuccess('Master CV saved successfully!');
    setIsEditing(false);

    // Offer to re-diagnose with updated text
    runDiagnosis(resumeText);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your master CV? This will delete your local copy and diagnosis.')) {
      localStorage.removeItem('ascent_master_resume');
      localStorage.removeItem('ascent_resume_name');
      localStorage.removeItem(STORAGE_KEY_CV_DIAGNOSIS);
      setResumeText('');
      setResumeName('');
      setDiagnosis(null);
      setSuccess('');
      setError('');
      setIsEditing(false);
    }
  };

  // Helper for score gauge color
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        ring: 'border-emerald-600',
        label: 'Strong Baseline Health'
      };
    }
    if (score >= 65) {
      return {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        ring: 'border-amber-500',
        label: 'Fair Health (Metric Deficits)'
      };
    }
    return {
      text: 'text-rose-800',
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      ring: 'border-rose-500',
      label: 'Needs Foundational Overhaul'
    };
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            Critical Fix
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            Priority Action
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            Recommended Action
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Master CV Workspace</h2>
        <p className="text-slate-500 text-base">
          Upload your core CV once to receive an instant clinical ATS diagnosis, overall verdict, and top 3 prescriptions before targeting specific roles.
        </p>
        <div className="p-3.5 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-indigo-700 flex items-start gap-2.5 max-w-2xl">
          <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <span><strong>Privacy First:</strong> Your uploaded CV, text, and diagnosis are saved strictly in your browser&apos;s local storage and never stored on our servers.</span>
        </div>
      </div>

      {/* Clinical CV Diagnosis: Doctor's Visit Section */}
      {resumeText && (
        <div className="space-y-4">
          {diagnosing ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-3.5 animate-in fade-in duration-200">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Stethoscope className="h-7 w-7 animate-pulse text-indigo-600" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-extrabold text-slate-800 text-base">Conducting Clinical CV Diagnosis...</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluating your Master CV across the 4 Diagnostic Pillars: Quantified Impact, Action Verbs, ATS Parsability, and Seniority Depth.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 pt-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing bullet metrics & parser hygiene...</span>
              </div>
            </div>
          ) : diagnosis ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* Doctor's Visit Header Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded-md bg-amber-400 text-slate-950">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Clinical CV Diagnosis
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      General ATS Baseline
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Doctor&apos;s Health Check & Overall Verdict
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsMethodologyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-2xs"
                    title="View the 4 Diagnostic Pillars and scoring weights"
                  >
                    <Scale className="h-3.5 w-3.5 text-amber-300" />
                    <span>Scoring Methodology (4 Pillars)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runDiagnosis(resumeText)}
                    disabled={diagnosing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-2xs"
                    title="Re-run diagnosis with current text"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${diagnosing ? 'animate-spin' : ''}`} />
                    <span>Re-diagnose</span>
                  </button>
                </div>
              </div>

              {/* Core Diagnosis Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Score & Verdict Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  {/* Left: Overall Health Score Gauge */}
                  <div className="lg:col-span-1 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                    <div className={`h-24 w-24 rounded-full border-4 ${getScoreTheme(diagnosis.baselineScore).ring} bg-white flex flex-col items-center justify-center shadow-md`}>
                      <span className="text-3xl font-black text-slate-800 leading-none">
                        {diagnosis.baselineScore}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        / 100
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-slate-800 mt-3 block">
                      Baseline ATS Health
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${getScoreTheme(diagnosis.baselineScore).text} ${getScoreTheme(diagnosis.baselineScore).bg} ${getScoreTheme(diagnosis.baselineScore).border}`}>
                      {getScoreTheme(diagnosis.baselineScore).label}
                    </span>
                  </div>

                  {/* Right: Clinical Verdict Callout */}
                  <div className="lg:col-span-3 space-y-3">
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/80 border-l-4 border-amber-500 rounded-r-2xl shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-amber-600" />
                          <span>Doctor&apos;s Clinical Assessment</span>
                        </span>
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                          {diagnosis.metricRatio}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-850 italic leading-relaxed">
                        &ldquo;{diagnosis.verdict}&rdquo;
                      </p>
                    </div>

                    {/* 4 Pillars Mini-Score Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-medium text-slate-500 block truncate">1. Impact (35%)</span>
                        <span className="text-sm font-black text-slate-800">{diagnosis.pillarScores.quantifiedImpact}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-medium text-slate-500 block truncate">2. Verbs (25%)</span>
                        <span className="text-sm font-black text-slate-800">{diagnosis.pillarScores.actionVerbs}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-medium text-slate-500 block truncate">3. Structure (20%)</span>
                        <span className="text-sm font-black text-slate-800">{diagnosis.pillarScores.structureParsability}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-medium text-slate-500 block truncate">4. Seniority (20%)</span>
                        <span className="text-sm font-black text-slate-800">{diagnosis.pillarScores.competencyDepth}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 3 Issues & Doctor's Prescriptions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Top 3 Critical Issues & Prescriptions</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                      Ordered by hiring impact
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {diagnosis.topIssues.map((issue, idx) => (
                      <div 
                        key={issue.id || idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              #{idx + 1} {issue.pillar.split('&')[0]}
                            </span>
                            {getSeverityBadge(issue.severity)}
                          </div>

                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {issue.title}
                          </h5>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {issue.diagnosis}
                          </p>
                        </div>

                        <div className="mt-2 pt-2.5 border-t border-slate-200/80 bg-white p-2.5 rounded-lg border text-xs text-indigo-950 font-medium space-y-0.5">
                          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                            Prescription (How to Fix):
                          </span>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {issue.prescription}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foundational Strengths */}
                {diagnosis.strengths && diagnosis.strengths.length > 0 && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-950">Foundational Strengths Detected:</span>
                      <ul className="text-xs text-slate-700 list-disc pl-4 space-y-0.5">
                        {diagnosis.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Workflow Bridge Banner */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 rounded-xl border border-indigo-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Ready to boost this score for a target role?</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Baseline health is <strong>{diagnosis.baselineScore}%</strong>. Tailoring for a specific job pushes your keyword match to <strong>85%+</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/radar"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Radar className="h-3.5 w-3.5" />
                      <span>Scan Radar</span>
                    </Link>

                    <Link
                      href="/tailor"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tailor for Job →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Clinical CV Diagnosis Not Run Yet
                  </h4>
                  <p className="text-xs text-slate-500">
                    Get an instant baseline ATS health score (0–100), clinical doctor verdict, and your top 3 issues.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => runDiagnosis(resumeText)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                <Stethoscope className="h-4 w-4" />
                <span>Run Doctor Diagnosis</span>
              </button>
            </div>
          )}

          {diagnosisError && (
            <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>{diagnosisError}</span>
              </div>
              <button
                type="button"
                onClick={() => runDiagnosis(resumeText)}
                className="text-xs font-bold text-amber-800 underline hover:text-amber-950"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Upload & Next Steps (Left) + Text Preview / Editor (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="md:col-span-1 space-y-5 h-fit">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              {resumeText ? 'Replace Master CV' : 'Upload Master CV'}
            </h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors cursor-pointer relative bg-slate-50">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-semibold text-indigo-600">Choose PDF file</span>
                  <span className="text-xs text-slate-400">PDF up to 5MB</span>
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 font-medium">
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Parsing Document...</span>
                  </>
                ) : (
                  'Upload & Extract'
                )}
              </button>
            </form>

            {/* Feedback alerts */}
            {error && (
              <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100 flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-blue-50 text-blue-950 text-sm rounded-lg border border-blue-200 flex gap-2 leading-relaxed font-medium">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-700 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Card */}
          {resumeText && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 rounded-xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <span className="p-1.5 bg-indigo-600 text-white rounded-md shadow-2xs">
                    <Radar className="h-3.5 w-3.5" />
                  </span>
                  <span>Next Actions</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  CV Ready
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Find Target Roles on Smart Job Radar
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your Master CV is saved! Head over to Smart Job Radar to scan live opportunities and calculate instant AI match scores.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/radar"
                  className="w-full py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Go to Smart Job Radar</span>
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/tailor"
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Already have a Job Description? Tailor CV</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Preview / Editor Column */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-4 relative group">
              <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <span className="font-bold text-slate-800 text-base truncate cursor-pointer">
                {resumeName ? `Parsed: ${resumeName}` : 'No CV Loaded'}
              </span>
              {resumeName && (
                <div className="absolute left-7 top-8 hidden group-hover:block bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap z-50">
                  Document: {resumeName}
                </div>
              )}
            </div>
            {resumeText && (
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <button
                    onClick={handleSaveText}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Raw Text</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleClear}
                  className="text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md border border-slate-300 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {resumeText ? (
              isEditing ? (
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full h-full p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 h-full overflow-y-auto">
                  {resumeText}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <FileText className="h-12 w-12 stroke-[1.5]" />
                <p className="text-sm font-semibold text-center max-w-xs leading-relaxed">
                  Your master CV text will appear here once parsed. You can edit the text manually to adjust parsing issues.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Diagnostic Pillars Methodology Modal */}
      <DiagnosticPillarsModal
        isOpen={isMethodologyModalOpen}
        onClose={() => setIsMethodologyModalOpen(false)}
        pillarScores={diagnosis?.pillarScores}
      />
    </div>
  );
}
