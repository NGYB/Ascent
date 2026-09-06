'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Radar, 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  BookmarkPlus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Zap, 
  DollarSign,
  Building2,
  Filter
} from 'lucide-react';

interface RadarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  via: string;
  description: string;
  postedAt?: string;
  scheduleType?: string;
  salary?: string;
  applyLink?: string;
  thumbnail?: string;
  matchScore?: number;
  matchRationale?: string;
  topMatches?: string[];
}

export default function RadarPage() {
  const router = useRouter();
  
  // Search inputs
  const [roleQuery, setRoleQuery] = useState('Product Manager');
  const [locationQuery, setLocationQuery] = useState('Singapore');
  const [remoteOnly, setRemoteOnly] = useState(false);
  
  // App state
  const [jobs, setJobs] = useState<RadarJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [hasMasterResume, setHasMasterResume] = useState(false);
  const [resumeText, setResumeText] = useState('');

  // Initial load
  useEffect(() => {
    try {
      const savedResume = localStorage.getItem('ascent_master_resume');
      if (savedResume) {
        setHasMasterResume(true);
        setResumeText(savedResume);
      }

      // Load already saved applications to show checkmark
      const savedApps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const savedTitles = new Set<string>(savedApps.map((a: any) => `${a.jobTitle}-${a.company}`));
      setSavedJobIds(savedTitles);
    } catch {}

    // Run initial scan
    fetchRadarJobs('Product Manager', 'Singapore', false);
  }, []);

  const fetchRadarJobs = async (q: string, loc: string, remote: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          location: loc,
          remoteOnly: remote,
          resumeText: resumeText || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setIsDemo(data.isDemo || false);
        setDemoMessage(data.message || '');
      }
    } catch (err) {
      console.error('Failed to fetch radar jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRadarJobs(roleQuery, locationQuery, remoteOnly);
  };

  // 1-Click Tailor CV: transfers role info directly into Tailoring workspace
  const handleTailorForJob = (job: RadarJob) => {
    try {
      const payload = {
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description
      };
      sessionStorage.setItem('ascent_import_job', JSON.stringify(payload));
      router.push('/tailor?import=radar');
    } catch (err) {
      console.error('Error initiating tailoring import:', err);
      router.push('/tailor');
    }
  };

  // 1-Click Save to Pipeline: Adds card into tracker under DRAFT
  const handleSaveToPipeline = (job: RadarJob) => {
    try {
      const apps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      const newApp = {
        id: crypto.randomUUID(),
        jobTitle: job.title,
        company: job.company,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      apps.push(newApp);
      localStorage.setItem('ascent_applications', JSON.stringify(apps));

      const key = `${job.title}-${job.company}`;
      setSavedJobIds(prev => new Set(prev).add(key));
    } catch (err) {
      console.error('Error saving to pipeline:', err);
    }
  };

  // Auto scan based on resume
  const handleScanFromCV = () => {
    if (!resumeText) {
      alert('Please upload a Master CV first in the CV Workspace to enable auto-matching.');
      return;
    }
    // Simple heuristic or prompt to derive top title
    const firstLines = resumeText.slice(0, 500);
    let detectedRole = 'Lead Product Manager';
    if (firstLines.toLowerCase().includes('director')) detectedRole = 'Director of Operations';
    else if (firstLines.toLowerCase().includes('engineer')) detectedRole = 'Engineering Manager';
    else if (firstLines.toLowerCase().includes('marketing')) detectedRole = 'Head of Marketing';

    setRoleQuery(detectedRole);
    fetchRadarJobs(detectedRole, locationQuery, remoteOnly);
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Radar className="h-6 w-6 animate-spin-slow" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Smart Job Radar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              SerpAPI + Google Jobs
            </span>
          </div>
          <p className="text-slate-500 text-sm max-w-3xl leading-relaxed">
            Live opportunity scanner aggregating active listings from LinkedIn, Indeed, Greenhouse, and company career pages. Evaluated with AI fit scoring against your Master CV.
          </p>
        </div>

        {hasMasterResume && (
          <button
            type="button"
            onClick={handleScanFromCV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg shadow-sm font-semibold text-xs transition-all flex-shrink-0 cursor-pointer"
            title="Scan market based on your uploaded Master CV"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>Auto-Scan for My CV</span>
          </button>
        )}
      </div>

      {/* Demo Notice Banner if SerpAPI key is not configured */}
      {isDemo && (
        <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold">SerpAPI Live Feed Notice</p>
            <p>{demoMessage}</p>
            <p className="text-[11px] text-amber-700">
              To activate real-time web searches, add <code className="px-1.5 py-0.5 bg-amber-100/80 rounded font-mono font-bold">SERPAPI_API_KEY</code> in your <code className="px-1.5 py-0.5 bg-amber-100/80 rounded font-mono font-bold">.env.local</code> file (or in Vercel Environment Variables).
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Role Query Input */}
          <div className="md:col-span-6 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              placeholder="e.g. Senior Product Manager, VP of Operations..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          {/* Location Input */}
          <div className="md:col-span-4 relative">
            <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="e.g. Singapore, Remote, London..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Radar className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Scan Radar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters and Quick Selects */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Quick Roles:
            </span>
            {['Product Manager', 'Operations Director', 'Engineering Lead', 'Strategy Lead'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setRoleQuery(tag);
                  fetchRadarJobs(tag, locationQuery, remoteOnly);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  roleQuery === tag 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => {
                setRemoteOnly(e.target.checked);
                fetchRadarJobs(roleQuery, locationQuery, e.target.checked);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-700">Remote / Flexible only</span>
          </label>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{jobs.length}</strong> active opportunities for <strong>"{roleQuery}"</strong> in <strong>{locationQuery || 'Anywhere'}</strong>
        </span>
        {hasMasterResume && (
          <span className="text-indigo-600 font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Fit Score matched against your Master CV
          </span>
        )}
      </div>

      {/* Jobs Feed Grid */}
      <div className="space-y-4">
        {jobs.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-3">
            <Radar className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
            <h4 className="text-base font-bold text-slate-700">No Postings Detected</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your target role or location keywords to broaden the radar scan.
            </p>
          </div>
        ) : (
          jobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isSaved = savedJobIds.has(`${job.title}-${job.company}`);
            const score = job.matchScore || 70;

            const scoreColor = score >= 80 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : score >= 65 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-slate-50 text-slate-600 border-slate-200';

            return (
              <div 
                key={job.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 space-y-4 group relative"
              >
                {/* Header Row: Title, Company, Match Score */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {job.via}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <strong>{job.company}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      {job.postedAt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {job.postedAt}
                          </span>
                        </>
                      )}
                      {job.scheduleType && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px]">
                            {job.scheduleType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI Fit Match Badge */}
                  <div className="flex items-center gap-2 self-start flex-shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${scoreColor}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      <div className="text-left">
                        <span className="text-xs font-black tracking-tight block">
                          {score}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Rationale & Top Skills */}
                {job.matchRationale && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-2">
                    <p className="text-slate-700 leading-relaxed italic">
                      "{job.matchRationale}"
                    </p>
                    {job.topMatches && job.topMatches.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Key Alignments:
                        </span>
                        {job.topMatches.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 shadow-2xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Detected Salary (if available) */}
                {job.salary && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-200/60 px-2.5 py-1 rounded-md w-fit font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Reported Salary: <strong>{job.salary}</strong></span>
                  </div>
                )}

                {/* Job Description (Expandable) */}
                <div className="space-y-2">
                  <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {job.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Read Full Job Specs</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>

                {/* Action Footer Bar */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
                  {/* Primary 1-Click Action: Tailor CV */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTailorForJob(job)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      title="Pre-fill this job description into Tailor & ATS Scorecard"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Tailor CV for this Role</span>
                    </button>

                    {/* 1-Click Save to Application Pipeline */}
                    <button
                      type="button"
                      onClick={() => handleSaveToPipeline(job)}
                      disabled={isSaved}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isSaved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      title={isSaved ? "Saved to Job Tracker" : "Save to Application Pipeline"}
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>In Pipeline</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5 text-slate-400" />
                          <span>Save to Pipeline</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Direct External Link to Apply on Source */}
                  {job.applyLink && (
                    <a
                      href={job.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                      title={`Open job posting on ${job.via}`}
                    >
                      <span>Apply on {job.via.replace(/^via\s*/i, '')}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
