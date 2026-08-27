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
  Trash2
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

interface TailorResponse {
  id?: string;
  tailoredResume: string;
  atsAnalysis: AtsAnalysis;
  coachFeedback: CoachFeedback;
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'coach' | 'resume' | 'scorecard' | 'skills'>('coach');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Load master resume text and history on mount
  useEffect(() => {
    const savedResume = localStorage.getItem('ascent_master_resume');
    if (savedResume) {
      setResumeText(savedResume);
    }

    const list = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
    setHistoryList(list);
  }, []);

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

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to tailor CV');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during CV tailoring.');
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
              size: A4;
              margin: 20mm 20mm 20mm 20mm;
            }
            @media print {
              body {
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
        company: company.trim() || 'Target Company',
        jobDescription,
        tailoredResume: result.tailoredResume,
        atsAnalysis: result.atsAnalysis,
        coachFeedback: result.coachFeedback,
        createdAt: new Date().toISOString()
      };

      tailoredList.push(newTailoredVersion);
      localStorage.setItem('ascent_tailored_resumes', JSON.stringify(tailoredList));
      setHistoryList(tailoredList);
      
      // Automatically create a draft in the Job Tracker
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const newApp = {
        id: crypto.randomUUID(),
        jobTitle,
        company: company.trim() || 'Target Company',
        status: 'DRAFT',
        tailoredResumeId: newTailoredVersion.id,
        createdAt: newTailoredVersion.id,
        updatedAt: new Date().toISOString()
      };
      apps.push(newApp);
      localStorage.setItem('ascent_applications', JSON.stringify(apps));

      setSaved(true);
      
      // Update result state to hold the newly saved ID
      setResult(prev => prev ? { ...prev, id: newTailoredVersion.id } : null);
    }
  };

  const handleLoadHistory = (item: any) => {
    setJobTitle(item.jobTitle);
    setCompany(item.company || '');
    setJobDescription(item.jobDescription || '');
    setResult({
      id: item.id,
      tailoredResume: item.tailoredResume,
      atsAnalysis: item.atsAnalysis,
      coachFeedback: item.coachFeedback
    });
    setSaved(true);
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
        setSaved(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
              <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span>Target Job Details</span>
              </h3>

              <form onSubmit={handleTailor} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">Target Job Title</label>
                  <input
                    type="text"
                    required
                    disabled={!resumeText || loading}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Project Manager, Staff Engineer"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">Company Name (Optional)</label>
                  <input
                    type="text"
                    disabled={!resumeText || loading}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, Acme Corp"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">Job Description</label>
                  <textarea
                    required
                    disabled={!resumeText || loading}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description here..."
                    rows={22}
                    className="w-full p-4 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleTailor}
                disabled={!resumeText || loading || !jobTitle || !jobDescription}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-base font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    onClick={() => setActiveTab('coach')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'coach'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Coach Evaluation
                  </button>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'resume'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tailored CV
                  </button>
                  <button
                    onClick={() => setActiveTab('scorecard')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'scorecard'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ATS Scorecard
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeTab === 'skills'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Pivot Translations
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-colors w-36"
                  >
                    <Copy className="h-4 w-4 flex-shrink-0" />
                    <span>{copied ? 'Copied!' : 'Copy markdown'}</span>
                  </button>

                  <button
                    onClick={handleSaveAsPdf}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                    <span>Save as PDF</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white px-3 py-1.5 rounded-md transition-colors"
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
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-6 font-sans">
                {activeTab === 'resume' && (
                  <div className="space-y-4 h-full">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 h-[800px] overflow-y-auto">
                      {result.tailoredResume}
                    </pre>
                  </div>
                )}

                {activeTab === 'coach' && (
                  <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
                    {/* Coach Score & Evaluation Card */}
                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-indigo-100/50">
                        {/* Score Circle */}
                        <div className="h-24 w-24 rounded-full border-4 border-indigo-600 bg-white flex flex-col items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-3xl font-black text-slate-800">{result.coachFeedback?.alignmentScore || 0}</span>
                          <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Fit Score</span>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                          <h4 className="font-bold text-slate-855 text-base">Career Coach Alignment Score</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            This score measures the overall compatibility between your background achievements and the target role description, highlighting baseline feasibility before optimization.
                          </p>
                        </div>
                      </div>

                      {/* Structured Feedback Sections */}
                      {result.coachFeedback?.strengths ? (
                        <div className="space-y-6">
                          {/* Strengths */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span>Top Transferable Strengths</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.strengths, 'No strengths analysis available.')}
                            </div>
                          </div>

                          {/* Gaps */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <span>Key Alignment Gaps</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.gaps, 'No gap analysis available.')}
                            </div>
                          </div>

                          {/* Suggestions */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                              <MessageSquare className="h-4 w-4 text-indigo-600" />
                              <span>Coaching Suggestions</span>
                            </div>
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm leading-relaxed">
                              {renderBulletPoints(result.coachFeedback.suggestions, 'No suggestions available.')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 leading-relaxed">
                          <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                            <span>Strategic Coach Insights</span>
                          </div>
                          <p className="text-sm text-slate-755 bg-white p-5 rounded-xl border border-indigo-100/50 shadow-sm whitespace-pre-wrap leading-relaxed italic">
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
                          <span className="text-lg font-black text-slate-500">{result.atsAnalysis.beforeScore}</span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Before</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">Original CV Match</h4>
                          <p className="text-xs text-slate-400">Baseline fit score</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                        <div className="h-16 w-16 rounded-full border-4 border-emerald-500 bg-emerald-50 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-lg font-black text-slate-800">{result.atsAnalysis.afterScore}</span>
                          <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">After</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-800 text-sm">Optimized CV Match</h4>
                          <p className="text-xs text-emerald-600/70 font-semibold">After tailoring edits</p>
                        </div>
                      </div>
                    </div>

                    {/* Keywords lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span>Matching Keywords ({result.atsAnalysis.matchingKeywords.length})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {result.atsAnalysis.matchingKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          <span>Missing Keywords ({result.atsAnalysis.missingKeywords.length})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {result.atsAnalysis.missingKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-155">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Upskilling Actions */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h5 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        <span>Recommended Upskilling Actions</span>
                      </h5>
                      <ul className="space-y-2">
                        {result.atsAnalysis.learningActions.map((action, i) => (
                          <li key={i} className="flex gap-2.5 items-start text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
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
                    <p className="text-sm text-slate-500 italic mb-2 leading-relaxed">
                      Below are the strategic translations applied during tailoring. Jargon and original phrasing have been mapped to target competencies to show maximum alignment.
                    </p>
                    <div className="space-y-4">
                      {result.atsAnalysis.transferableSkills.map((item, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white hover:border-slate-300 transition-colors">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original Experience</span>
                              <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                                {item.original}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tailored Experience</span>
                              <p className="text-sm text-slate-800 bg-amber-50/50 p-2.5 rounded border border-amber-100 font-semibold leading-relaxed">
                                {item.tailored}
                              </p>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm text-slate-500 leading-relaxed">
                            <span className="font-bold text-slate-700">Rationale: </span>
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-[880px] text-slate-400 p-8 gap-3 animate-in fade-in duration-200">
              <Sparkles className="h-16 w-16 stroke-[1.5] animate-pulse text-slate-300" />
              <h4 className="font-bold text-slate-800 text-base">Awaiting Target Parameters</h4>
              <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed">
                Enter your target Job Title and paste the Job Description on the left, then click Tailor CV to run the AI engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Tailoring History Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-805 text-sm uppercase tracking-wider">
            Tailoring History
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-sm bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            {historyList.length}
          </span>
        </div>

        {historyList.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No past versions tailored yet.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            {historyList.map((item) => {
              const isCurrent = result?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-4 group relative cursor-pointer ${
                    isCurrent 
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-sm shadow-indigo-100/50 font-medium' 
                      : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-350'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-2 min-w-0">
                    <h4 className={`font-bold text-sm truncate max-w-md ${
                      isCurrent ? 'text-indigo-900 font-extrabold' : 'text-slate-800'
                    }`}>
                      {item.jobTitle}
                    </h4>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <span className="text-slate-500 font-medium">
                        Fit Score: <span className="font-extrabold text-indigo-600">{item.coachFeedback?.alignmentScore ?? 0}%</span>
                      </span>
                      <span className="text-slate-350 hidden sm:inline">•</span>
                      <span className="text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
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
