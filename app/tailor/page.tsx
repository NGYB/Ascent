'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  FileText, 
  Percent, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle,
  TrendingUp, 
  Copy,
  ChevronRight,
  RefreshCw,
  FolderPlus,
  Save,
  MessageSquare,
  Trash2,
  Target,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Lightbulb,
  Info,
  HelpCircle,
  ChevronDown,
  Building2,
  ArrowUpDown,
  ShieldAlert,
  ExternalLink,
  ArrowLeft,
  Send,
  RotateCcw
} from 'lucide-react';

interface TransferableSkill {
  original: string;
  tailored: string;
  explanation: string;
}

interface AtsAnalysis {
  beforeScore: number;
  afterScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  learningActions: string[];
  transferableSkills: TransferableSkill[];
}

interface CoachFeedback {
  alignmentScore: number;
  strengths?: string[] | string;
  gaps?: string[] | string;
  suggestions?: string[] | string;
  feedbackText?: string;
}

interface JdMustHave {
  skill: string;
  matched: boolean;
  recruiterRationale: string;
  candidateEvidence: string;
}

interface JdGoodToHave {
  skill: string;
  matched: boolean;
  recruiterRationale: string;
  substituteAdvice: string;
}

interface JdDeflator {
  verdict: string;
  mustHavesMatchRate: number;
  goodToHavesMatchRate: number;
  mustHaves: JdMustHave[];
  goodToHaves: JdGoodToHave[];
}

interface TailorResponse {
  id?: string;
  tailoredResume: string;
  atsAnalysis: AtsAnalysis;
  coachFeedback: CoachFeedback;
  jdDeflator?: JdDeflator;
  applyUrl?: string;
}

// Renders either a JSON array or parses a legacy/concatenated bulleted string
// dynamically, ensuring each point is on its own separate bulleted line.
const renderBulletPoints = (items: string[] | string | undefined, defaultMsg: string) => {
  if (!items) return <p className="text-sm text-slate-500 italic">{defaultMsg}</p>;
  
  if (Array.isArray(items)) {
    return (
      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
        {items.map((item, idx) => {
          const cleanItem = item.replace(/^-\s*/, '').trim();
          return cleanItem ? <li key={idx}>{cleanItem}</li> : null;
        })}
      </ul>
    );
  }
  
  // Fallback: Split on newlines OR on hyphens that follow a word and period (e.g. "expertise.- Direct" -> "expertise", "- Direct")
  const points = items
    .split(/(?:\r?\n|(?<=\w)\.-)/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
      {points.map((point, idx) => {
        let cleanPoint = point.replace(/^-\s*/, '').trim();
        if (cleanPoint.startsWith('.')) {
          cleanPoint = cleanPoint.slice(1).trim();
        }
        return cleanPoint ? <li key={idx}>{cleanPoint}</li> : null;
      })}
    </ul>
  );
};

// Converts standard Markdown of the Tailored CV into print-friendly HTML styling
const convertMarkdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Escape HTML tags to prevent cross-site scripting (but allow our own tags)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size: 18pt; font-weight: bold; border-bottom: 2px solid #334155; padding-bottom: 5px; margin-top: 0px; margin-bottom: 8px; color: #1e293b; text-align: center; font-family: \'Georgia\', serif;">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size: 11.5pt; font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 2px; margin-top: 16px; margin-bottom: 8px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; page-break-after: avoid; break-after: avoid;">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size: 10pt; font-weight: bold; margin-top: 10px; margin-bottom: 4px; color: #334155; display: flex; justify-content: space-between; page-break-after: avoid; break-after: avoid;">$1</h3>');

  // 2. Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #0f172a;">$1</strong>');

  // 3. Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none; border-bottom: 1px dashed #2563eb;">$1</a>');

  // 4. Bullet points - match list items first
  html = html.replace(/^[\-\*]\s+(.*?)$/gm, '<li style="margin-bottom: 4px; line-height: 1.4; color: #334155; page-break-inside: avoid; break-inside: avoid;">$1</li>');
  
  // Wrap adjacent <li> tags inside <ul> containers
  html = html.replace(/(<li.*?>[\s\S]*?<\/li>\s*)+/g, (match) => {
    return `<ul style="list-style-type: disc; margin-top: 4px; margin-bottom: 8px; padding-left: 20px;">${match}</ul>`;
  });

  // 5. Paragraphs - clean wrapping of standard lines
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<ol') || trimmed.startsWith('</ul')) {
      return line;
    }
    // Center aligned contact info sections
    if (trimmed.includes('|')) {
      return `<p style="margin-top: 4px; margin-bottom: 8px; line-height: 1.4; color: #475569; text-align: center; font-size: 9.5pt;">${line}</p>`;
    }
    return `<p style="margin-top: 4px; margin-bottom: 6px; line-height: 1.4; color: #334155;">${line}</p>`;
  }).join('\n');

  return html;
};

export default function TailorPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [fromRadar, setFromRadar] = useState(false);
  const [appliedState, setAppliedState] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'deflator' | 'coach' | 'resume' | 'scorecard' | 'skills'>('deflator');
  const [showExplainer, setShowExplainer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  type HistorySortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';
  const [historySortBy, setHistorySortBy] = useState<HistorySortOption>('date-desc');

  const sortedHistoryList = [...historyList].sort((a, b) => {
    if (historySortBy === 'date-desc') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (historySortBy === 'date-asc') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (historySortBy === 'score-desc') {
      const scoreA = a.coachFeedback?.alignmentScore ?? a.atsAnalysis?.afterScore ?? 0;
      const scoreB = b.coachFeedback?.alignmentScore ?? b.atsAnalysis?.afterScore ?? 0;
      return scoreB - scoreA;
    }
    if (historySortBy === 'score-asc') {
      const scoreA = a.coachFeedback?.alignmentScore ?? a.atsAnalysis?.afterScore ?? 0;
      const scoreB = b.coachFeedback?.alignmentScore ?? b.atsAnalysis?.afterScore ?? 0;
      return scoreA - scoreB;
    }
    return 0;
  });

  const loadStoredTailorData = () => {
    const savedResume = localStorage.getItem('ascent_master_resume');
    setResumeText(savedResume || '');

    const list = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
    setHistoryList(list);
  };

  // Load master resume text and history on mount
  useEffect(() => {
    loadStoredTailorData();

    // Check if imported from Smart Job Radar
    try {
      const imported = sessionStorage.getItem('ascent_import_job');
      if (imported) {
        const parsed = JSON.parse(imported);
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
        if (parsed.applyLink) setApplyUrl(parsed.applyLink);
        setFromRadar(true);
        sessionStorage.removeItem('ascent_import_job');
      } else if (typeof window !== 'undefined' && window.location.search.includes('import=radar')) {
        setFromRadar(true);
      }
    } catch {}

    window.addEventListener('ascent-storage-cleared', loadStoredTailorData);
    return () => window.removeEventListener('ascent-storage-cleared', loadStoredTailorData);
  }, []);

  const getApplyLink = () => {
    if (applyUrl && applyUrl.trim()) {
      const trimmed = applyUrl.trim();
      return trimmed.startsWith('http://') || trimmed.startsWith('https://') 
        ? trimmed 
        : `https://${trimmed}`;
    }
    const query = [jobTitle, company, 'apply job'].filter(Boolean).join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  const handleMarkAsApplied = () => {
    try {
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const existingIdx = apps.findIndex((a: any) => 
        (result?.id && a.tailoredResumeId === result.id) || 
        (a.jobTitle === jobTitle && a.company === (company.trim() || 'Target Company'))
      );

      if (existingIdx !== -1) {
        apps[existingIdx].status = 'APPLIED';
        if (applyUrl.trim() && !apps[existingIdx].applyUrl) {
          apps[existingIdx].applyUrl = applyUrl.trim();
        }
        apps[existingIdx].updatedAt = new Date().toISOString();
      } else {
        const newApp = {
          id: crypto.randomUUID(),
          jobTitle,
          company: company.trim() || 'Target Company',
          status: 'APPLIED',
          applyUrl: applyUrl.trim() || undefined,
          tailoredResumeId: result?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        apps.push(newApp);
      }

      localStorage.setItem('ascent_applications', JSON.stringify(apps));
      setAppliedState(true);
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartFresh = () => {
    setJobTitle('');
    setCompany('');
    setApplyUrl('');
    setJobDescription('');
    setResult(null);
    setSaved(false);
    setAppliedState(false);
    setError('');
    setFromRadar(false);
    setActiveTab('deflator');
    try {
      sessionStorage.removeItem('ascent_import_job');
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState({}, '', '/tailor');
      }
    } catch {}
  };

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      setError('Please upload a master CV in the CV Workspace first.');
      return;
    }
    if (!jobTitle || !jobDescription) {
      setError('Please provide a target job title and description.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    setAppliedState(false);

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to tailor CV';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          const text = await res.text().catch(() => '');
          if (res.status === 504 || text.includes('FUNCTION_INVOCATION_TIMEOUT') || text.includes('Gateway Timeout')) {
            errorMsg = 'AI analysis timed out. Processing speed has been optimized—please try clicking "Tailor & Score CV" again.';
          } else if (res.status >= 500) {
            errorMsg = `Server error (${res.status}). Please try again shortly.`;
          } else {
            errorMsg = text.slice(0, 150) || `Request failed with status ${res.status}`;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setResult({ ...data, applyUrl: applyUrl.trim() || undefined });
      if (data.jdDeflator) {
        setActiveTab('deflator');
      } else {
        setActiveTab('coach');
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Network connection interrupted or server timed out while analyzing your CV. Please check your connection and click "Tailor & Score CV" again.');
      } else {
        setError(err.message || 'An error occurred during CV tailoring.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsPdf = () => {
    if (!result) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to save the CV as a PDF.');
      return;
    }

    const htmlContent = convertMarkdownToHtml(result.tailoredResume);
    
    // Extract candidate name from markdown title if possible (e.g. first # header)
    const nameMatch = result.tailoredResume.match(/^#\s+(.+)$/m);
    const candidateName = nameMatch ? nameMatch[1].trim() : 'Tailored';
    const cleanFileName = (candidateName.replace(/\s+/g, '_') + '_CV').replace(/[^a-zA-Z0-9_]/g, '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cleanFileName}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              margin: 20mm;
            }
            @media print {
              body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: "Calibri", "Arial", sans-serif;
              color: #1e293b;
              line-height: 1.4;
              font-size: 10.5pt;
              margin: 0;
              padding: 0;
            }
            h1, h2, h3, p, ul, li {
              margin: 0;
              padding: 0;
            }
            p, li {
              color: #334155;
            }
            a {
              color: #1e3a8a;
              text-decoration: underline;
            }
            h1 {
              text-align: center;
              font-family: "Georgia", serif;
            }
            li {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            h2 {
              page-break-after: avoid;
              break-after: avoid;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 800px; margin: 0 auto;">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSave = () => {
    if (result) {
      const tailoredList = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      
      const newTailoredVersion = {
        id: crypto.randomUUID(),
        jobTitle,
        company: company.trim(),
        jobDescription,
        applyUrl: applyUrl.trim() || undefined,
        tailoredResume: result.tailoredResume,
        atsAnalysis: result.atsAnalysis,
        coachFeedback: result.coachFeedback,
        jdDeflator: result.jdDeflator,
        createdAt: new Date().toISOString()
      };

      tailoredList.push(newTailoredVersion);
      localStorage.setItem('ascent_tailored_resumes', JSON.stringify(tailoredList));
      setHistoryList(tailoredList);
      
      // Automatically create a draft or applied entry in the Job Tracker
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const newApp = {
        id: crypto.randomUUID(),
        jobTitle,
        company: company.trim() || 'Target Company',
        status: appliedState ? 'APPLIED' : 'DRAFT',
        applyUrl: applyUrl.trim() || undefined,
        tailoredResumeId: newTailoredVersion.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      apps.push(newApp);
      localStorage.setItem('ascent_applications', JSON.stringify(apps));

      setSaved(true);
      
      // Update result state to hold the newly saved ID
      setResult(prev => prev ? { ...prev, id: newTailoredVersion.id, applyUrl: applyUrl.trim() || undefined } : null);
    }
  };

  const handleLoadHistory = (item: any) => {
    setJobTitle(item.jobTitle);
    setCompany(item.company && item.company !== 'Target Company' ? item.company : '');
    setJobDescription(item.jobDescription || '');
    setApplyUrl(item.applyUrl || '');
    setResult({
      id: item.id,
      tailoredResume: item.tailoredResume,
      atsAnalysis: item.atsAnalysis,
      coachFeedback: item.coachFeedback,
      jdDeflator: item.jdDeflator,
      applyUrl: item.applyUrl
    });
    if (item.jdDeflator) {
      setActiveTab('deflator');
    } else {
      setActiveTab('coach');
    }
    setSaved(true);
    try {
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const match = apps.find((a: any) => a.tailoredResumeId === item.id || (a.jobTitle === item.jobTitle && a.company === (item.company || 'Target Company')));
      if (match && match.status === 'APPLIED') {
        setAppliedState(true);
      } else {
        setAppliedState(false);
      }
    } catch {
      setAppliedState(false);
    }
    setError('');
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('Delete this tailored history record? This will also remove it from your sessions.')) {
      const list = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      const updated = list.filter((r: any) => r.id !== id);
      localStorage.setItem('ascent_tailored_resumes', JSON.stringify(updated));
      setHistoryList(updated);

      // If currently showing deleted item, clear results
      if (result && result.id === id) {
        setResult(null);
        setJobTitle('');
        setCompany('');
        setJobDescription('');
        setApplyUrl('');
        setAppliedState(false);
        setSaved(false);
      }
    }
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto space-y-6">
      {fromRadar && (
        <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-200">
          <Link 
            href="/radar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-pine-800 hover:text-pine-950 bg-pine-50 hover:bg-pine-100 border border-pine-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Smart Job Radar</span>
          </Link>
          <span className="text-xs text-ink-500 font-medium">
            Imported role: <strong className="text-ink-900">{jobTitle || 'Job Posting'}</strong> {company ? `at ${company}` : ''}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tailor & ATS Scorecard</h2>
        <p className="text-slate-500 text-base">
          Optimize your experience for target roles. Enter the target job specs below to generate an ATS-compatible CV and view transition analytics.
        </p>
      </div>

      {!resumeText && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-center justify-between text-base">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <span>You need to upload your core CV before you can tailor it.</span>
          </div>
          <Link href="/cv" className="font-bold underline flex items-center gap-1">
            <span>Upload CV</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      )}

      {/* Top Grid Panel: Form & Results side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Left Column: Target Job Details Form (2/5 columns = 40%) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 h-full flex flex-col justify-between animate-in fade-in duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Target Job Details</span>
                </h3>
                {(result || jobTitle || jobDescription || applyUrl) && (
                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200"
                    title="Clear all fields and start fresh"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Start fresh</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleTailor} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-ink-700">Target Job Title</label>
                  <input
                    type="text"
                    required
                    disabled={!resumeText || loading}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Project Manager, Staff Engineer"
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-base text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-ink-700">Company Name (Optional)</label>
                  <input
                    type="text"
                    disabled={!resumeText || loading}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, Acme Corp"
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-base text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-ink-700">Application Link / URL (Optional)</label>
                    {applyUrl && (
                      <a 
                        href={getApplyLink()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 font-semibold"
                        title="Test application link"
                      >
                        <span>Test link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    disabled={!resumeText || loading}
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    placeholder="e.g. https://careers.company.com/job/123 or job portal link"
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-ink-700">Job Description</label>
                  <textarea
                    required
                    disabled={!resumeText || loading}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description here..."
                    rows={22}
                    className="w-full p-4 bg-white border border-sand-300 rounded-xl text-sm font-mono text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none resize-none leading-relaxed shadow-2xs"
                  />
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-amber-50 text-amber-950 text-sm rounded-xl border border-amber-300 flex items-start gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleTailor}
                disabled={!resumeText || loading || !jobTitle || !jobDescription}
                className="w-full py-3.5 px-4 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl text-base font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Tailoring CV...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Tailor & Score CV</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="w-full py-2.5 px-4 bg-white hover:bg-sand-100 text-ink-700 border border-sand-300 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                  title="Clear all fields and start fresh"
                >
                  <RotateCcw className="h-4 w-4 text-ink-500" />
                  <span>Start Fresh (Clear Form & Results)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results Column (3/5 columns = 60%) */}
        <div className="lg:col-span-3 flex flex-col">
          {result ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[880px] overflow-hidden animate-in fade-in duration-200">
              {/* Tab Navigation */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('deflator')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'deflator'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Target className="h-4 w-4 text-amber-500" />
                    <span>JD Deflator</span>
                    {result.jdDeflator && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        result.jdDeflator.mustHavesMatchRate >= 80 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {result.jdDeflator.mustHavesMatchRate}%
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('coach')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      activeTab === 'coach'
                        ? 'bg-pine-900 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-sand-200 hover:bg-sand-100'
                    }`}
                  >
                    Coach Evaluation
                  </button>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      activeTab === 'resume'
                        ? 'bg-pine-900 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-sand-200 hover:bg-sand-100'
                    }`}
                  >
                    Tailored CV
                  </button>
                  <button
                    onClick={() => setActiveTab('scorecard')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      activeTab === 'scorecard'
                        ? 'bg-pine-900 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-sand-200 hover:bg-sand-100'
                    }`}
                  >
                    ATS Scorecard
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      activeTab === 'skills'
                        ? 'bg-pine-900 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-sand-200 hover:bg-sand-100'
                    }`}
                  >
                    Pivot Translations
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={getApplyLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                    title={applyUrl ? "Open the official job application link" : "Search Google Jobs to apply for this role"}
                  >
                    <ExternalLink className="h-4 w-4 text-slate-950 flex-shrink-0" />
                    <span>Apply ↗</span>
                  </a>

                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-ink-700 hover:bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 transition-colors w-36 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 flex-shrink-0" />
                    <span>{copied ? 'Copied!' : 'Copy markdown'}</span>
                  </button>

                  <button
                    onClick={handleSaveAsPdf}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-ink-700 hover:bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                    <span>Save as PDF</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 disabled:bg-sand-300 disabled:opacity-95 text-white px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Saved to Tracker!</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4" />
                        <span>Save & Track Job</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleStartFresh}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-ink-700 hover:bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 transition-colors cursor-pointer"
                    title="Clear inputs and start fresh"
                  >
                    <RotateCcw className="h-4 w-4 text-ink-500" />
                    <span>Start fresh</span>
                  </button>
                </div>
              </div>

              {/* Application Launchpad Banner */}
              <div className="bg-gradient-to-r from-pine-950 via-pine-900 to-pine-950 text-white p-4 sm:p-5 border-b border-pine-850/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-terracotta-500 text-white">Next Step</span>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      Ready to Apply for {jobTitle ? <span className="text-terracotta-300 font-extrabold">{jobTitle}</span> : 'this role'}?
                    </h4>
                  </div>
                  <p className="text-xs text-sand-200">
                    Your tailored CV and dealbreaker analysis are ready. Launch your application or track pipeline progress.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <a
                    href={getApplyLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex-1 md:flex-initial"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{applyUrl ? 'Open Application ↗' : 'Search & Apply Online ↗'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleMarkAsApplied}
                    disabled={appliedState}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all flex-1 md:flex-initial ${
                      appliedState 
                        ? 'bg-emerald-800/80 border-emerald-600 text-emerald-100 cursor-default' 
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    {appliedState ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Marked as Applied!</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-terracotta-300" />
                        <span>Mark as &apos;Applied&apos;</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                    title="Clear inputs and start fresh for a new role"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Start Fresh</span>
                  </button>

                  <Link
                    href="/radar"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                    title="Return to Smart Job Radar"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Job Radar</span>
                  </Link>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-6 font-sans">
                {activeTab === 'deflator' && (
                  <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
                    {result.jdDeflator ? (
                      <>
                        {/* Recruiter Verdict Hero Banner */}
                        <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
                          result.jdDeflator.mustHavesMatchRate >= 80
                            ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200 text-blue-950'
                            : result.jdDeflator.mustHavesMatchRate >= 60
                            ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-200 text-amber-950'
                            : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border-slate-200 text-slate-900'
                        }`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg flex items-center justify-center ${
                                result.jdDeflator.mustHavesMatchRate >= 80
                                  ? 'bg-blue-700 text-white'
                                  : result.jdDeflator.mustHavesMatchRate >= 60
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}>
                                <ShieldCheck className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-extrabold tracking-wider uppercase">
                                {result.jdDeflator.mustHavesMatchRate >= 80
                                  ? 'Recruiter Verdict: Strong Fit — Recommended to Apply'
                                  : result.jdDeflator.mustHavesMatchRate >= 60
                                  ? 'Recruiter Verdict: Viable with Strategic Positioning'
                                  : 'Recruiter Verdict: Significant Structural Gap'}
                              </span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              result.jdDeflator.mustHavesMatchRate >= 80
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : result.jdDeflator.mustHavesMatchRate >= 60
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              Must-Have Fit: {result.jdDeflator.mustHavesMatchRate}%
                            </span>
                          </div>

                          <p className="text-sm font-medium leading-relaxed">
                            {result.jdDeflator.verdict}
                          </p>
                        </div>

                        {/* 2-Metric Comparison Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Must Haves Card */}
                          <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert className="h-4 w-4 text-terracotta-600 flex-shrink-0" />
                                <span>Core Must-Haves (Dealbreakers)</span>
                              </span>
                              <span className={`text-xl font-black ${
                                result.jdDeflator.mustHavesMatchRate >= 80 ? 'text-pine-700' : 'text-ink-900'
                              }`}>
                                {result.jdDeflator.mustHavesMatchRate}%
                              </span>
                            </div>
                            <div className="w-full bg-sand-100 h-2.5 rounded-full overflow-hidden border border-sand-200">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  result.jdDeflator.mustHavesMatchRate >= 80 ? 'bg-pine-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${result.jdDeflator.mustHavesMatchRate}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-ink-600 font-medium">
                              {result.jdDeflator.mustHaves.filter(m => m.matched).length} of {result.jdDeflator.mustHaves.length} non-negotiable requirements satisfied
                            </p>
                          </div>

                          {/* Good To Haves Card */}
                          <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                <span>Recruiter Wishlist (Learnable)</span>
                              </span>
                              <span className="text-xl font-black text-ink-700">
                                {result.jdDeflator.goodToHavesMatchRate}%
                              </span>
                            </div>
                            <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${result.jdDeflator.goodToHavesMatchRate}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-ink-400">
                              {result.jdDeflator.goodToHaves.filter(g => g.matched).length} of {result.jdDeflator.goodToHaves.length} wishlist preferences matched
                            </p>
                          </div>
                        </div>

                        {/* 4-Layer Recruiter Model Explainer */}
                        <div className="bg-sand-50/80 border border-sand-200/90 rounded-xl overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() => setShowExplainer(!showExplainer)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-ink-800 hover:bg-sand-100/70 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-pine-700 flex-shrink-0" />
                              <span>How does the JD Deflator classify requirements? (The 4-Layer Recruiter Model)</span>
                            </div>
                            <span className="text-ink-500 text-[11px] font-semibold flex items-center gap-1">
                              <span>{showExplainer ? 'Hide Model' : 'View 4-Layer Model'}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showExplainer ? 'rotate-180' : ''}`} />
                            </span>
                          </button>

                          {showExplainer && (
                            <div className="p-4 pt-0 border-t border-sand-200/60 bg-white space-y-3.5 animate-in fade-in duration-150">
                              <p className="text-ink-500 leading-relaxed text-xs pt-3">
                                Recruiters frequently write inflated job descriptions listing dozens of &quot;requirements&quot;. Ascent applies a 4-layer heuristic model to separate true screening dealbreakers from flexible wishlist preferences:
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Layer 1 */}
                                <div className="p-3 bg-sand-50/80 rounded-lg border border-sand-200/80 space-y-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-ink-900 text-xs">
                                    <span className="h-5 w-5 rounded-full bg-pine-100 text-pine-800 flex items-center justify-center text-[10px] font-black">1</span>
                                    <span>Structural Section Cues</span>
                                  </div>
                                  <p className="text-ink-600 text-[11px] leading-relaxed">
                                    Parses explicit structural boundaries like <em>&quot;Basic / Minimum Qualifications&quot;</em> (Must-Haves) versus <em>&quot;Preferred / Bonus Pluses&quot;</em> (Wishlist).
                                  </p>
                                </div>

                                {/* Layer 2 */}
                                <div className="p-3 bg-sand-50/80 rounded-lg border border-sand-200/80 space-y-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-ink-900 text-xs">
                                    <span className="h-5 w-5 rounded-full bg-pine-100 text-pine-800 flex items-center justify-center text-[10px] font-black">2</span>
                                    <span>Linguistic Modality &amp; Verbs</span>
                                  </div>
                                  <p className="text-ink-600 text-[11px] leading-relaxed">
                                    Evaluates urgency: <em>&quot;5+ years required&quot;</em> and <em>&quot;proven track record&quot;</em> signal hard filters; <em>&quot;familiarity with&quot;</em> or <em>&quot;working knowledge&quot;</em> are flexible.
                                  </p>
                                </div>

                                {/* Layer 3 */}
                                <div className="p-3 bg-sand-50/80 rounded-lg border border-sand-200/80 space-y-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-ink-900 text-xs">
                                    <span className="h-5 w-5 rounded-full bg-pine-100 text-pine-800 flex items-center justify-center text-[10px] font-black">3</span>
                                    <span>Learnability Horizon</span>
                                  </div>
                                  <p className="text-ink-600 text-[11px] leading-relaxed">
                                    Core foundations (systems architecture, stakeholder alignment) take 6+ months to master &rarr; <strong>Must-Have</strong>. Interchangeable tools (Snowflake, React, Jira) ramp up in 1–2 weeks &rarr; <strong>Good-to-Have</strong>.
                                  </p>
                                </div>

                                {/* Layer 4 */}
                                <div className="p-3 bg-sand-50/80 rounded-lg border border-sand-200/80 space-y-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-ink-900 text-xs">
                                    <span className="h-5 w-5 rounded-full bg-pine-100 text-pine-800 flex items-center justify-center text-[10px] font-black">4</span>
                                    <span>Centrality to Deliverables</span>
                                  </div>
                                  <p className="text-ink-600 text-[11px] leading-relaxed">
                                    Maps requirements directly against the daily responsibilities listed in the role. Core deliverables take precedence over auxiliary stack wishlists.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Requirements Breakdown: 2 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                          {/* Column 1: Must-Haves */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-sand-200">
                              <h4 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-terracotta-100 text-terracotta-900 border border-terracotta-200 uppercase">
                                  Dealbreakers
                                </span>
                                <span>Day-1 Non-Negotiables</span>
                              </h4>
                              <span className="text-xs font-bold text-ink-600">
                                {result.jdDeflator.mustHaves.length} items
                              </span>
                            </div>

                            <div className="space-y-3">
                              {result.jdDeflator.mustHaves.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    item.matched 
                                      ? 'bg-white border-slate-200 shadow-sm hover:border-blue-300' 
                                      : 'bg-amber-50/50 border-amber-300 border-dashed shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        {item.matched ? (
                                          <CheckCircle2 className="h-4 w-4 text-blue-700 flex-shrink-0" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-amber-800 flex-shrink-0" />
                                        )}
                                        <span className="text-xs font-bold text-slate-800 leading-snug">
                                          {item.skill}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                      item.matched 
                                        ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                                        : 'bg-amber-100 text-amber-950 border border-amber-300 border-dashed'
                                    }`}>
                                      {item.matched ? '✓ Verified' : '✕ Skill Gap'}
                                    </span>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                    <div className="text-slate-600">
                                      <strong className="text-slate-700">Why Recruiter Cares: </strong>
                                      <span>{item.recruiterRationale}</span>
                                    </div>
                                    <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                                      <strong className="text-slate-800">CV Evidence: </strong>
                                      <span>{item.candidateEvidence}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 2: Good-To-Haves */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                                  Wishlist
                                </span>
                                <span>Learnable on the Job</span>
                              </h4>
                              <span className="text-xs font-bold text-slate-600">
                                {result.jdDeflator.goodToHaves.length} items
                              </span>
                            </div>

                            <div className="space-y-3">
                              {result.jdDeflator.goodToHaves.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    item.matched 
                                      ? 'bg-white border-slate-200 shadow-sm hover:border-blue-300' 
                                      : 'bg-amber-50/30 border-amber-200/80 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        {item.matched ? (
                                          <CheckCircle2 className="h-4 w-4 text-blue-700 flex-shrink-0" />
                                        ) : (
                                          <Zap className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                        )}
                                        <span className="text-xs font-bold text-slate-800 leading-snug">
                                          {item.skill}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                      item.matched 
                                        ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                                    }`}>
                                      {item.matched ? '✓ Bonus Match' : '▲ Learnable'}
                                    </span>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                    <div className="text-slate-600">
                                      <strong className="text-slate-700">Why It&apos;s Flexible: </strong>
                                      <span>{item.recruiterRationale}</span>
                                    </div>
                                    <div className="text-amber-950 bg-amber-50/70 p-2 rounded border border-amber-200">
                                      <strong className="text-amber-950">💡 Bridge / Substitute: </strong>
                                      <span>{item.substituteAdvice}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <Info className="h-8 w-8 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-slate-700 text-sm">JD Deflator Data Not Available for this Record</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          This tailored resume was generated before the JD Deflator analysis was added. Re-tailor this job description to view the dealbreaker vs. wishlist breakdown.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'resume' && (
                  <div className="space-y-4 h-full">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 h-[800px] overflow-y-auto">
                      {result.tailoredResume}
                    </pre>
                  </div>
                )}

                {activeTab === 'coach' && (
                  <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
                    {result.jdDeflator && (
                      <div 
                        onClick={() => setActiveTab('deflator')}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 cursor-pointer border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Target className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold text-amber-950">JD Deflator Assessment: </span>
                            <span className="text-amber-800">{result.jdDeflator.mustHavesMatchRate}% of core dealbreakers matched.</span>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                          <span>View Dealbreaker Radar</span>
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    )}

                    {/* Coach Score & Evaluation Card */}
                    <div className="bg-sand-100/70 border border-sand-200 rounded-2xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-sand-200">
                        {/* Score Circle */}
                        <div className="h-24 w-24 rounded-full border-4 border-terracotta-600 bg-white flex flex-col items-center justify-center shadow-xs flex-shrink-0">
                          <span className="text-3xl font-black text-ink-900">{result.coachFeedback?.alignmentScore || 0}</span>
                          <span className="text-[9px] text-terracotta-600 font-bold uppercase tracking-widest mt-0.5">Fit Score</span>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                          <h4 className="font-bold text-ink-900 text-base">Career Coach Alignment Score</h4>
                          <p className="text-sm text-ink-600 leading-relaxed">
                            This score measures the overall compatibility between your background achievements and the target role description, highlighting baseline feasibility before optimization.
                          </p>
                        </div>
                      </div>

                      {/* Structured Feedback Sections */}
                      {result.coachFeedback?.strengths ? (
                        <div className="space-y-6">
                          {/* Strengths */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                              <CheckCircle className="h-4 w-4 text-blue-700" />
                              <span>Top Transferable Strengths</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-sand-200 shadow-2xs leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.strengths, 'No strengths analysis available.')}
                            </div>
                          </div>

                          {/* Gaps */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                              <AlertTriangle className="h-4 w-4 text-amber-700" />
                              <span>Key Alignment Gaps</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-sand-200 shadow-2xs leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.gaps, 'No gap analysis available.')}
                            </div>
                          </div>

                          {/* Suggestions */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-pine-900 font-bold text-sm">
                              <MessageSquare className="h-4 w-4 text-pine-700" />
                              <span>Coaching Suggestions</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-sand-200 shadow-2xs leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.suggestions, 'No suggestions available.')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 leading-relaxed">
                          <div className="flex items-center gap-2 text-pine-900 font-bold text-sm">
                            <MessageSquare className="h-5 w-5 text-pine-700" />
                            <span>Strategic Coach Insights</span>
                          </div>
                          <p className="text-sm text-ink-800 bg-white p-5 rounded-xl border border-sand-200 shadow-2xs whitespace-pre-wrap leading-relaxed italic">
                            "{result.coachFeedback?.feedbackText || 'No coach evaluation text available.'}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'scorecard' && (
                  <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
                    {/* Score Circle Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-300 bg-slate-50 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-lg font-black text-slate-700">{result.atsAnalysis.beforeScore}</span>
                          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Before</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">Original CV Match</h4>
                          <p className="text-xs text-slate-500 font-medium">Baseline fit score</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-blue-300 shadow-sm">
                        <div className="h-16 w-16 rounded-full border-4 border-blue-600 bg-blue-50 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-lg font-black text-blue-950">{result.atsAnalysis.afterScore}</span>
                          <span className="text-[8px] text-blue-700 font-bold uppercase tracking-wider">After</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 text-sm">Optimized CV Match</h4>
                          <p className="text-xs text-blue-700 font-semibold">After tailoring edits</p>
                        </div>
                      </div>
                    </div>

                    {/* Keywords lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-700" />
                          <span>Matching Keywords ({result.atsAnalysis.matchingKeywords.length})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {result.atsAnalysis.matchingKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-blue-50 text-blue-900 text-sm font-semibold border border-blue-200 flex items-center gap-1.5">
                              <span className="text-blue-700 font-bold">✓</span>
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-700" />
                          <span>Missing Keywords ({result.atsAnalysis.missingKeywords.length})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {result.atsAnalysis.missingKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-amber-50 text-amber-950 text-sm font-semibold border border-dashed border-amber-300 flex items-center gap-1.5">
                              <span className="text-amber-700 font-bold">✕</span>
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Upskilling Actions */}
                    <div className="space-y-3 pt-4 border-t border-sand-100">
                      <h5 className="font-bold text-sm uppercase tracking-wider text-ink-800 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-pine-700" />
                        <span>Recommended Upskilling Actions</span>
                      </h5>
                      <ul className="space-y-2">
                        {result.atsAnalysis.learningActions.map((action, i) => (
                          <li key={i} className="flex gap-2.5 items-start text-sm text-ink-700 bg-sand-50 p-2.5 rounded-lg border border-sand-100 leading-relaxed">
                            <span className="h-5 w-5 rounded-full bg-pine-50 text-pine-800 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                              {i + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2">
                    <p className="text-sm text-ink-500 italic mb-2 leading-relaxed">
                      Below are the strategic translations applied during tailoring. Jargon and original phrasing have been mapped to target competencies to show maximum alignment.
                    </p>
                    <div className="space-y-4">
                      {result.atsAnalysis.transferableSkills.map((item, i) => (
                        <div key={i} className="p-4 rounded-xl border border-sand-200 space-y-3 bg-white hover:border-sand-300 transition-colors">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Original Experience</span>
                              <p className="text-sm text-ink-700 bg-sand-50 p-2.5 rounded border border-sand-100 leading-relaxed">
                                {item.original}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tailored Experience</span>
                              <p className="text-sm text-ink-900 bg-amber-50/50 p-2.5 rounded border border-amber-100 font-semibold leading-relaxed">
                                {item.tailored}
                              </p>
                            </div>
                          </div>
                          <div className="bg-sand-50 p-2.5 rounded-lg border border-sand-100 text-sm text-ink-600 leading-relaxed">
                            <span className="font-bold text-ink-800">Rationale: </span>
                            {item.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-sand-200 shadow-xs flex flex-col items-center justify-center h-[880px] text-ink-400 p-8 gap-3 animate-in fade-in duration-200">
              <Sparkles className="h-16 w-16 stroke-[1.5] animate-pulse text-sand-300" />
              <h4 className="font-bold text-ink-900 text-base">Awaiting Target Parameters</h4>
              <p className="text-sm text-ink-500 text-center max-w-sm leading-relaxed">
                Enter your target Job Title and paste the Job Description on the left, then click Tailor CV to run the AI engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Tailoring History Panel */}
      <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-xs space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-sand-100 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-ink-900 text-sm uppercase tracking-wider">
              Tailoring History
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-pine-50 text-pine-800 font-bold border border-pine-200">
              {historyList.length}
            </span>
          </div>

          {historyList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="history-sort" className="text-xs text-ink-500 font-medium flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-pine-700" />
                <span className="hidden sm:inline">Sort by:</span>
              </label>
              <select
                id="history-sort"
                value={historySortBy}
                onChange={(e) => setHistorySortBy(e.target.value as HistorySortOption)}
                className="text-xs font-semibold text-ink-700 bg-sand-50 hover:bg-sand-100 border border-sand-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-terracotta-500 outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="date-desc">Date: Newest first</option>
                <option value="date-asc">Date: Oldest first</option>
                <option value="score-desc">Fit Score: Highest first</option>
                <option value="score-asc">Fit Score: Lowest first</option>
              </select>
            </div>
          )}
        </div>

        {historyList.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No past versions tailored yet.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            {sortedHistoryList.map((item) => {
              const isCurrent = result?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-4 group relative cursor-pointer ${
                    isCurrent 
                      ? 'border-terracotta-600 bg-terracotta-50/25 shadow-xs font-medium' 
                      : 'border-sand-200 bg-sand-50/40 hover:bg-sand-100/60 hover:border-sand-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <h4 className={`font-bold text-sm truncate ${
                        isCurrent ? 'text-terracotta-900 font-extrabold' : 'text-ink-900'
                      }`}>
                        {item.jobTitle}
                      </h4>
                      {item.company && item.company.trim() !== '' && item.company !== 'Target Company' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sand-100 text-ink-700 border border-sand-200 truncate max-w-[180px]">
                          <Building2 className="h-3 w-3 text-ink-400 flex-shrink-0" />
                          <span className="truncate">{item.company}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <span className="text-ink-500 font-medium">
                        Fit Score: <span className="font-extrabold text-terracotta-600">{item.coachFeedback?.alignmentScore ?? item.atsAnalysis?.afterScore ?? 0}%</span>
                      </span>
                      <span className="text-sand-300 hidden sm:inline">•</span>
                      <span className="text-ink-400">
                        {(() => {
                          const d = new Date(item.createdAt);
                          return !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Recent';
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-650 opacity-0 group-hover:opacity-100 transition-opacity rounded flex-shrink-0 ml-2"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
