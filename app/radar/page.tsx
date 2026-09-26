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
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Zap, 
  DollarSign,
  Building2,
  Filter,
  ArrowDownWideNarrow,
  X
} from 'lucide-react';
import { isBlockedJob } from '@/lib/job-blocklist';

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

const QUICK_ROLES = [
  'Product Manager',
  'Data Scientist',
  'AI Engineer',
  'Operations Director',
  'Sales Director'
] as const;

export default function RadarPage() {
  const router = useRouter();
  
  // Search inputs
  const [roleQuery, setRoleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('Singapore');
  const [remoteOnly, setRemoteOnly] = useState(false);
  
  // Actively searched / displayed parameters
  const [searchedRole, setSearchedRole] = useState('');
  const [searchedLocation, setSearchedLocation] = useState('Singapore');
  
  // App state
  const [jobs, setJobs] = useState<RadarJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExtractingRoles, setIsExtractingRoles] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [demoMessage, setDemoMessage] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [hasMasterResume, setHasMasterResume] = useState(false);
  const [resumeText, setResumeText] = useState('');

  // Initial load
  useEffect(() => {
    const loadRadarState = () => {
      try {
        const savedResume = localStorage.getItem('ascent_master_resume') || '';
        if (savedResume) {
          setHasMasterResume(true);
          setResumeText(savedResume);
        }

        // Load cached suggestions if available
        const cachedSuggestions = localStorage.getItem('ascent_radar_suggested_roles');
        if (cachedSuggestions) {
          setSuggestedRoles(JSON.parse(cachedSuggestions));
        }
        const cachedDomain = localStorage.getItem('ascent_radar_domain');
        if (cachedDomain) {
          setDetectedDomain(cachedDomain);
        }

        // Load already saved applications to show checkmark
        const savedApps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
        const savedTitles = new Set<string>(savedApps.map((a: any) => `${a.jobTitle}-${a.company}`));
        setSavedJobIds(savedTitles);

        // Restore last searched parameters
        const lastRole = sessionStorage.getItem('ascent_radar_cached_role') || localStorage.getItem('ascent_radar_last_role') || '';
        const lastLocation = sessionStorage.getItem('ascent_radar_cached_location') || localStorage.getItem('ascent_radar_last_location') || 'Singapore';
        const lastRemoteStr = sessionStorage.getItem('ascent_radar_cached_remote') || localStorage.getItem('ascent_radar_last_remote');
        const lastRemote = lastRemoteStr === 'true';

        if (lastRole) {
          setRoleQuery(lastRole);
        }
        if (lastLocation) {
          setLocationQuery(lastLocation);
        }
        setRemoteOnly(lastRemote);

        // Restore cached job cards so user doesn't have to re-search from scratch
        const cachedJobsStr = sessionStorage.getItem('ascent_radar_cached_jobs') || localStorage.getItem('ascent_radar_cached_jobs');
        if (cachedJobsStr && lastRole) {
          const parsedJobs: RadarJob[] = JSON.parse(cachedJobsStr);
          if (Array.isArray(parsedJobs) && parsedJobs.length > 0) {
            setJobs(parsedJobs);
            setSearchedRole(lastRole);
            setSearchedLocation(lastLocation);
          }
        }
      } catch (err) {
        console.error('Error loading radar state:', err);
      }
    };

    loadRadarState();

    window.addEventListener('ascent-storage-cleared', loadRadarState);
    return () => window.removeEventListener('ascent-storage-cleared', loadRadarState);
  }, []);

  const fetchRadarJobs = async (q: string, loc: string, remote: boolean, explicitResume?: string) => {
    const trimmedQuery = q.trim();
    const trimmedLocation = loc.trim();

    if (!trimmedQuery) {
      setJobs([]);
      setSearchedRole('');
      setSearchedLocation(trimmedLocation);
      try {
        localStorage.removeItem('ascent_radar_last_role');
        localStorage.removeItem('ascent_radar_cached_jobs');
        sessionStorage.removeItem('ascent_radar_cached_role');
        sessionStorage.removeItem('ascent_radar_cached_jobs');
      } catch {}
      return;
    }

    setLoading(true);
    setSearchedRole(trimmedQuery);
    setSearchedLocation(trimmedLocation);

    try {
      // Ensure we always capture the resume text, even before state re-renders
      let activeResume = explicitResume !== undefined ? explicitResume : resumeText;
      if (!activeResume && typeof window !== 'undefined') {
        activeResume = localStorage.getItem('ascent_master_resume') || '';
        if (activeResume && !resumeText) {
          setResumeText(activeResume);
          setHasMasterResume(true);
        }
      }

      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuery,
          location: trimmedLocation,
          remoteOnly: remote,
          resumeText: activeResume || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const returnedJobs: RadarJob[] = (data.jobs || []).filter((j: RadarJob) => !isBlockedJob(j));
        // Ensure sorted by matchScore descending (highest match on top)
        returnedJobs.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        setJobs(returnedJobs);
        setIsDemo(data.isDemo || false);
        setHasApiKey(data.hasApiKey ?? true);
        setDemoMessage(data.message || '');

        // Persist last searched role and results so user never has to re-search from scratch
        try {
          localStorage.setItem('ascent_radar_last_role', trimmedQuery);
          localStorage.setItem('ascent_radar_last_location', trimmedLocation);
          localStorage.setItem('ascent_radar_last_remote', String(remote));
          localStorage.setItem('ascent_radar_cached_jobs', JSON.stringify(returnedJobs));
          sessionStorage.setItem('ascent_radar_cached_role', trimmedQuery);
          sessionStorage.setItem('ascent_radar_cached_location', trimmedLocation);
          sessionStorage.setItem('ascent_radar_cached_remote', String(remote));
          sessionStorage.setItem('ascent_radar_cached_jobs', JSON.stringify(returnedJobs));
        } catch {}
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Failed to fetch radar jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleQuery.trim()) {
      setJobs([]);
      setSearchedRole('');
      setSearchedLocation(locationQuery.trim());
      try {
        localStorage.removeItem('ascent_radar_last_role');
        localStorage.removeItem('ascent_radar_cached_jobs');
        sessionStorage.removeItem('ascent_radar_cached_role');
        sessionStorage.removeItem('ascent_radar_cached_jobs');
      } catch {}
      return;
    }
    fetchRadarJobs(roleQuery.trim(), locationQuery.trim(), remoteOnly);
  };

  const handleToggleQuickRole = (tag: string) => {
    const isCurrentlyChecked = 
      searchedRole.trim().toLowerCase() === tag.toLowerCase() && 
      roleQuery.trim().toLowerCase() === tag.toLowerCase() && 
      jobs.length > 0;

    if (isCurrentlyChecked) {
      // Uncheck it and clear opportunities
      setRoleQuery('');
      setSearchedRole('');
      setJobs([]);
      try {
        localStorage.removeItem('ascent_radar_last_role');
        localStorage.removeItem('ascent_radar_cached_jobs');
        sessionStorage.removeItem('ascent_radar_cached_role');
        sessionStorage.removeItem('ascent_radar_cached_jobs');
      } catch {}
    } else {
      setRoleQuery(tag);
      try {
        localStorage.setItem('ascent_radar_last_role', tag);
        sessionStorage.setItem('ascent_radar_cached_role', tag);
      } catch {}
      fetchRadarJobs(tag, locationQuery, remoteOnly);
    }
  };

  const handleToggleSuggestedRole = (tag: string) => {
    const isCurrentlyChecked = 
      searchedRole.trim().toLowerCase() === tag.toLowerCase() && 
      roleQuery.trim().toLowerCase() === tag.toLowerCase() && 
      jobs.length > 0;

    if (isCurrentlyChecked) {
      setRoleQuery('');
      setSearchedRole('');
      setJobs([]);
      try {
        localStorage.removeItem('ascent_radar_last_role');
        localStorage.removeItem('ascent_radar_cached_jobs');
        sessionStorage.removeItem('ascent_radar_cached_role');
        sessionStorage.removeItem('ascent_radar_cached_jobs');
      } catch {}
    } else {
      setRoleQuery(tag);
      try {
        localStorage.setItem('ascent_radar_last_role', tag);
        sessionStorage.setItem('ascent_radar_cached_role', tag);
      } catch {}
      fetchRadarJobs(tag, locationQuery, remoteOnly);
    }
  };

  // 1-Click Tailor CV: transfers role info directly into Tailoring workspace
  const handleTailorForJob = (job: RadarJob) => {
    if (isBlockedJob(job)) {
      alert('This posting has been flagged and blocked as an unverified/scam source.');
      return;
    }
    try {
      const payload = {
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
        applyLink: job.applyLink
      };
      sessionStorage.setItem('ascent_import_job', JSON.stringify(payload));
      router.push('/tailor?import=radar');
    } catch (err) {
      console.error('Error initiating tailoring import:', err);
      router.push('/tailor');
    }
  };

  // Auto scan based on resume using AI role & domain extraction
  const handleScanFromCV = async () => {
    const activeCv = resumeText || (typeof window !== 'undefined' ? localStorage.getItem('ascent_master_resume') || '' : '');
    if (!activeCv) {
      if (confirm('No Master CV found yet. Would you like to go to the CV Workspace to upload your CV now?')) {
        router.push('/cv');
      }
      return;
    }

    setIsExtractingRoles(true);
    try {
      const res = await fetch('/api/radar/extract-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: activeCv })
      });

      if (res.ok) {
        const data = await res.json();
        const primary = data.primaryRole || 'Strategic Consultant';
        const suggestions = data.suggestedRoles && data.suggestedRoles.length > 0 
          ? data.suggestedRoles 
          : [primary];
        const domain = data.domain || null;

        setRoleQuery(primary);
        setSuggestedRoles(suggestions);
        setDetectedDomain(domain);

        try {
          localStorage.setItem('ascent_radar_last_role', primary);
          sessionStorage.setItem('ascent_radar_cached_role', primary);
          localStorage.setItem('ascent_radar_suggested_roles', JSON.stringify(suggestions));
          if (domain) localStorage.setItem('ascent_radar_domain', domain);
        } catch {}

        fetchRadarJobs(primary, locationQuery, remoteOnly, activeCv);
      } else {
        alert('Could not extract roles from CV. Please try searching manually.');
      }
    } catch (err) {
      console.error('Error extracting roles from CV:', err);
      alert('Network error while analyzing CV with AI.');
    } finally {
      setIsExtractingRoles(false);
    }
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pine-50 border border-pine-200 rounded-xl text-pine-700">
              <Radar className="h-6 w-6 animate-spin-slow" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Smart Job Radar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sand-100 text-ink-700 border border-sand-200">
              SerpAPI + Google Jobs
            </span>
          </div>
          <p className="text-ink-500 text-sm max-w-3xl leading-relaxed">
            Live opportunity scanner aggregating active listings from LinkedIn, Indeed, Greenhouse, and company career pages. Evaluated with AI fit scoring against your Master CV.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanFromCV}
          disabled={isExtractingRoles || loading}
          className="flex items-center justify-center gap-2.5 px-5 py-2.5 sm:py-3 bg-pine-900 hover:bg-pine-950 text-white rounded-xl shadow-xs font-bold text-sm sm:text-base transition-all w-full sm:w-auto flex-shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-pine-800"
          title={hasMasterResume ? "Intelligently analyze your CV with AI to scan target roles in your specific domain" : "Upload your Master CV to auto-scan matching roles with AI"}
        >
          {isExtractingRoles ? (
            <>
              <Sparkles className="h-5 w-5 animate-spin text-terracotta-300" />
              <span>Analyzing CV with AI...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 text-terracotta-400 fill-terracotta-400 animate-pulse" />
              <span>Auto-Scan for My CV</span>
            </>
          )}
        </button>
      </div>

      {/* Demo Notice Banner if SerpAPI key is not configured or no live results returned */}
      {isDemo && (
        <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold">{!hasApiKey ? 'SerpAPI Setup' : 'Search Notice'}</p>
            <p>{demoMessage}</p>
            {!hasApiKey && (
              <p className="text-[11px] text-amber-700">
                To activate real-time web searches, add <code className="px-1.5 py-0.5 bg-amber-100/80 rounded font-mono font-bold">SERPAPI_API_KEY</code> in your <code className="px-1.5 py-0.5 bg-amber-100/80 rounded font-mono font-bold">.env</code> file (or in Vercel Environment Variables).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 sm:p-5 rounded-2xl border border-sand-300 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Role Query Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label htmlFor="radar-role-input" className="text-xs font-bold text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-pine-700" />
              <span>Target Role / Job Title</span>
            </label>
            <div className="relative">
              <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="radar-role-input"
                type="text"
                value={roleQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoleQuery(val);
                  try {
                    localStorage.setItem('ascent_radar_last_role', val);
                  } catch {}
                }}
                placeholder="e.g. Product Manager, Data Scientist, AI Engineer..."
                className="w-full pl-10 pr-9 py-2.5 text-base md:text-sm font-semibold text-ink-900 placeholder:text-ink-400 placeholder:font-normal bg-white border border-sand-300 rounded-xl outline-none focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100 shadow-2xs transition-all"
              />
              {roleQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setRoleQuery('');
                    setJobs([]);
                    setSearchedRole('');
                    try {
                      localStorage.removeItem('ascent_radar_last_role');
                      localStorage.removeItem('ascent_radar_cached_jobs');
                      sessionStorage.removeItem('ascent_radar_cached_role');
                      sessionStorage.removeItem('ascent_radar_cached_jobs');
                    } catch {}
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 rounded-md transition-colors"
                  title="Clear input"
                  aria-label="Clear role input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Location Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label htmlFor="radar-location-input" className="text-xs font-bold text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-pine-700" />
              <span>Location</span>
            </label>
            <div className="relative">
              <MapPin className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="radar-location-input"
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocationQuery(val);
                  try {
                    localStorage.setItem('ascent_radar_last_location', val);
                  } catch {}
                }}
                placeholder="e.g. Singapore, Remote, London..."
                className="w-full pl-10 pr-9 py-2.5 text-base md:text-sm font-semibold text-ink-900 placeholder:text-ink-400 placeholder:font-normal bg-white border border-sand-300 rounded-xl outline-none focus:border-terracotta-600 focus:ring-2 focus:ring-terracotta-100 shadow-2xs transition-all"
              />
              {locationQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationQuery('');
                    try {
                      localStorage.removeItem('ascent_radar_last_location');
                      sessionStorage.removeItem('ascent_radar_cached_location');
                    } catch {}
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-700 rounded-md transition-colors"
                  title="Clear location"
                  aria-label="Clear location input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading || isExtractingRoles || !roleQuery.trim()}
              className="w-full py-2.5 px-4 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-[42px] shadow-xs"
            >
              {loading ? (
                <>
                  <Radar className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Scan Jobs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Suggested Roles from CV Analysis */}
        {suggestedRoles.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 flex-nowrap md:flex-wrap pt-2 border-t border-sand-200 text-xs">
            <span className="font-semibold text-pine-900 flex items-center gap-1.5 bg-pine-50/90 px-2.5 py-1 rounded-lg border border-pine-200/80 flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-pine-700" />
              <span>{detectedDomain ? `Target Roles (${detectedDomain}):` : 'AI Suggested Roles:'}</span>
            </span>
            {suggestedRoles.map((tag) => {
              const isSuggestedChecked = 
                searchedRole.trim().toLowerCase() === tag.toLowerCase() && 
                roleQuery.trim().toLowerCase() === tag.toLowerCase() && 
                jobs.length > 0;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleSuggestedRole(tag)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex-shrink-0 ${
                    isSuggestedChecked
                      ? 'bg-pine-900 text-white border-pine-900 font-bold shadow-xs'
                      : 'bg-white hover:bg-sand-50 text-ink-700 border-sand-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    isSuggestedChecked 
                      ? 'bg-white border-white text-pine-900' 
                      : 'border-sand-300 bg-white'
                  }`}>
                    {isSuggestedChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Roles & Remote Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-sand-200 text-xs text-ink-500">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 flex-nowrap md:flex-wrap">
            <span className="font-semibold text-ink-800 flex items-center gap-1 flex-shrink-0">
              <Filter className="h-3 w-3" /> Quick Roles:
            </span>
            {QUICK_ROLES.map((tag) => {
              const isChecked = 
                searchedRole.trim().toLowerCase() === tag.toLowerCase() && 
                roleQuery.trim().toLowerCase() === tag.toLowerCase() && 
                jobs.length > 0;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleQuickRole(tag)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex-shrink-0 ${
                    isChecked 
                      ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-300 font-bold shadow-xs ring-1 ring-terracotta-200' 
                      : 'bg-sand-50 hover:bg-sand-100 text-ink-700 border-sand-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    isChecked 
                      ? 'bg-terracotta-600 border-terracotta-600 text-white' 
                      : 'bg-white border-sand-300'
                  }`}>
                    {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 pt-0.5 sm:pt-0">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => {
                const nextRemote = e.target.checked;
                setRemoteOnly(nextRemote);
                try {
                  localStorage.setItem('ascent_radar_last_remote', String(nextRemote));
                  sessionStorage.setItem('ascent_radar_cached_remote', String(nextRemote));
                } catch {}
                if (searchedRole.trim()) {
                  fetchRadarJobs(searchedRole, locationQuery, nextRemote);
                }
              }}
              className="rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500"
            />
            <span className="text-xs font-medium text-ink-700">Remote / Flexible only</span>
          </label>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-500 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {loading ? (
            <span>
              Scanning radar for <strong>"{searchedRole || roleQuery}"</strong> in <strong>{searchedLocation || locationQuery || 'Anywhere'}</strong>...
            </span>
          ) : searchedRole && jobs.length > 0 ? (
            <span>
              Showing <strong>{jobs.length}</strong> active opportunities for <strong>"{searchedRole}"</strong> in <strong>{searchedLocation || 'Anywhere'}</strong>
            </span>
          ) : searchedRole && jobs.length === 0 ? (
            <span>
              Showing <strong>0</strong> active opportunities for <strong>"{searchedRole}"</strong> in <strong>{searchedLocation || 'Anywhere'}</strong>
            </span>
          ) : (
            <span>
              Showing <strong>0</strong> active opportunities
            </span>
          )}
          {jobs.length > 1 && !loading && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pine-50/90 text-pine-800 border border-pine-200/80 font-semibold text-[11px]">
              <ArrowDownWideNarrow className="h-3 w-3 text-pine-700" />
              Highest Match on Top
            </span>
          )}
        </div>
        {hasMasterResume ? (
          <span className="text-pine-700 font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Fit Score matched against your Master CV
          </span>
        ) : (
          <span className="text-ink-500 font-medium flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-ink-400" />
            Search Relevance Score (Upload Master CV in CV Workspace for personalized AI fit scoring)
          </span>
        )}
      </div>

      {/* Jobs Feed Grid */}
      <div className="space-y-4">
        {loading && jobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-sand-300 space-y-3">
            <Radar className="h-10 w-10 text-pine-700 mx-auto animate-spin" />
            <h4 className="text-base font-bold text-ink-800">Scanning Radar...</h4>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Gathering active listings and evaluating AI fit scores.
            </p>
          </div>
        ) : jobs.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-sand-300 space-y-4">
            <Radar className="h-10 w-10 text-ink-300 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-ink-800">
                {searchedRole ? 'No Postings Detected' : 'No Active Opportunities'}
              </h4>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                {searchedRole 
                  ? 'Try adjusting your target role or location keywords to broaden the radar scan.' 
                  : 'Select a quick role above, click "Auto-Scan for My CV", or enter a target role in the search box and click "Scan Radar".'}
              </p>
            </div>
            {!searchedRole && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleScanFromCV}
                  disabled={isExtractingRoles || loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-terracotta-500/30 ring-2 ring-terracotta-500/20"
                >
                  <Zap className="h-4.5 w-4.5 text-amber-300 fill-amber-300 animate-pulse" />
                  <span>Auto-Scan for My CV</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          jobs.filter((j) => !isBlockedJob(j)).map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isSaved = savedJobIds.has(`${job.title}-${job.company}`);
            const score = job.matchScore || 70;

            const scoreColor = score >= 80 
              ? 'bg-pine-50 text-pine-900 border-pine-200' 
              : score >= 65 
              ? 'bg-amber-50 text-amber-900 border-amber-200' 
              : 'bg-sand-100 text-ink-800 border-sand-300';

            const matchTier = score >= 80 
              ? 'High Fit' 
              : score >= 65 
              ? 'Good Fit' 
              : 'Transferable';

            return (
              <div 
                key={job.id} 
                className="bg-white rounded-xl border border-sand-200 shadow-xs hover:border-sand-300 transition-all p-5 space-y-4 group relative"
              >
                {/* Header Row: Title, Company, Match Score */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-ink-900 group-hover:text-terracotta-600 transition-colors">
                        {job.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {job.via}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <strong>{job.company}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {job.location}
                      </span>
                      {job.postedAt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            {job.postedAt}
                          </span>
                        </>
                      )}
                      {job.scheduleType && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 text-[11px] font-medium">
                            {job.scheduleType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI Fit Match Badge */}
                  <div className="flex items-center gap-2 self-start flex-shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${scoreColor}`}>
                      <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-black tracking-tight block">
                          {score}% Match • {matchTier}
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
                  <div className="flex items-center gap-1.5 text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md w-fit font-medium">
                    <DollarSign className="h-3.5 w-3.5 text-blue-700" />
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
                    className="text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 cursor-pointer py-1 touch-manipulation"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-sand-200">
                  {/* Primary 1-Click Action: Tailor CV */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleTailorForJob(job)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[40px] sm:min-h-[36px]"
                      title="Pre-fill this job description into Tailor & ATS Scorecard"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isSaved ? 'Re-tailor CV for this Role' : 'Tailor CV for this Role'}</span>
                    </button>

                    {isSaved && (
                      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 flex-shrink-0 min-h-[40px] sm:min-h-[36px]">
                        <Check className="h-3.5 w-3.5 text-blue-700" />
                        <span>In Pipeline</span>
                      </span>
                    )}
                  </div>

                  {/* Direct External Link to Apply on Source */}
                  {job.applyLink && (
                    <a
                      href={job.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 sm:py-1.5 sm:px-2 rounded-lg bg-slate-50 hover:bg-slate-100 sm:bg-transparent sm:hover:bg-transparent border border-slate-200 sm:border-transparent text-xs text-slate-700 sm:text-slate-500 hover:text-slate-900 sm:hover:text-slate-800 font-semibold sm:font-medium transition-colors min-h-[40px] sm:min-h-0 w-full sm:w-auto text-center"
                      title={`Open job posting on ${job.via}`}
                    >
                      <span>Apply on {job.via.replace(/^via\s*/i, '')}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
