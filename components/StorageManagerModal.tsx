'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  Radar, 
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StorageCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  keys: string[];
  sizeBytes: number;
  itemCount: number;
}

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStorageCleared?: () => void;
}

export default function StorageManagerModal({ isOpen, onClose, onStorageCleared }: StorageManagerModalProps) {
  const [categories, setCategories] = useState<StorageCategory[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const calculateStorage = () => {
    if (typeof window === 'undefined') return;

    try {
      const getBytes = (key: string) => {
        const val = localStorage.getItem(key);
        return val ? new Blob([val]).size : 0;
      };

      const getCount = (key: string) => {
        try {
          const val = localStorage.getItem(key);
          if (!val) return 0;
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          return localStorage.getItem(key) ? 1 : 0;
        }
      };

      // 1. Master CV
      const cvSize = getBytes('ascent_master_resume') + getBytes('ascent_resume_name');
      const cvCount = localStorage.getItem('ascent_master_resume') ? 1 : 0;

      // 2. Tailored Resumes
      const tailoredSize = getBytes('ascent_tailored_resumes');
      const tailoredCount = getCount('ascent_tailored_resumes');

      // 3. Interview Sessions & History
      const interviewSize = getBytes('ascent_interview_session') + getBytes('ascent_interview_history');
      const interviewCount = (localStorage.getItem('ascent_interview_session') ? 1 : 0) + getCount('ascent_interview_history');

      // 4. Job Tracker
      const trackerSize = getBytes('ascent_applications');
      const trackerCount = getCount('ascent_applications');

      // 5. Job Radar Cache
      const radarSize = getBytes('ascent_radar_suggested_roles') + getBytes('ascent_radar_domain');
      const radarCount = (localStorage.getItem('ascent_radar_suggested_roles') ? 1 : 0) + (localStorage.getItem('ascent_radar_domain') ? 1 : 0);

      const cats: StorageCategory[] = [
        {
          id: 'interview',
          name: 'Interview Prep & History',
          description: 'Active mock interview room sessions, answers, and AI feedback history.',
          icon: MessageSquare,
          keys: ['ascent_interview_session', 'ascent_interview_history'],
          sizeBytes: interviewSize,
          itemCount: interviewCount
        },
        {
          id: 'tailored',
          name: 'Tailored CVs & ATS Reports',
          description: 'Customized resumes, ATS match scores, and JD Deflator evaluations.',
          icon: Sparkles,
          keys: ['ascent_tailored_resumes'],
          sizeBytes: tailoredSize,
          itemCount: tailoredCount
        },
        {
          id: 'tracker',
          name: 'Job Application Pipeline',
          description: 'Tracked job opportunities, interview stages, notes, and Sankey status.',
          icon: Kanban,
          keys: ['ascent_applications'],
          sizeBytes: trackerSize,
          itemCount: trackerCount
        },
        {
          id: 'cv',
          name: 'Master CV Document',
          description: 'Your uploaded core CV text and document name.',
          icon: FileText,
          keys: ['ascent_master_resume', 'ascent_resume_name'],
          sizeBytes: cvSize,
          itemCount: cvCount
        },
        {
          id: 'radar',
          name: 'Job Radar Cache',
          description: 'Cached career domains and AI target search title suggestions.',
          icon: Radar,
          keys: ['ascent_radar_suggested_roles', 'ascent_radar_domain'],
          sizeBytes: radarSize,
          itemCount: radarCount
        }
      ];

      const sum = cats.reduce((acc, c) => acc + c.sizeBytes, 0);
      setCategories(cats);
      setTotalBytes(sum);
    } catch (err) {
      console.error('Error calculating storage:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateStorage();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1000) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Browser standard limit is typically 5MB (~5,242,880 bytes)
  const maxBytes = 5 * 1024 * 1024;
  const usedPercentage = Math.min(100, Math.max(0, (totalBytes / maxBytes) * 100));

  const handleClearCategory = (cat: StorageCategory) => {
    if (confirm(`Are you sure you want to delete all stored data for "${cat.name}"? This action cannot be undone.`)) {
      cat.keys.forEach(k => localStorage.removeItem(k));
      calculateStorage();
      setSuccessNotice(`Cleared data for ${cat.name}.`);
      setTimeout(() => setSuccessNotice(''), 3000);
      window.dispatchEvent(new Event('ascent-storage-cleared'));
      if (onStorageCleared) onStorageCleared();
    }
  };

  const handleClearAll = () => {
    if (confirm('CAUTION: This will delete ALL Ascent data from this browser (Master CV, Tailored Resumes, Interview Sessions, and Application Tracker). Are you sure?')) {
      const allKeys = [
        'ascent_master_resume',
        'ascent_resume_name',
        'ascent_tailored_resumes',
        'ascent_interview_session',
        'ascent_interview_history',
        'ascent_applications',
        'ascent_radar_suggested_roles',
        'ascent_radar_domain'
      ];
      allKeys.forEach(k => localStorage.removeItem(k));
      calculateStorage();
      setSuccessNotice('All Ascent local storage has been wiped.');
      setTimeout(() => setSuccessNotice(''), 3000);
      window.dispatchEvent(new Event('ascent-storage-cleared'));
      if (onStorageCleared) onStorageCleared();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Data & Storage Manager</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Browser LocalStorage
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ascent stores all data privately inside your browser. No personal documents are stored on remote servers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Usage Meter Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-600" />
                <span>Total Storage Used</span>
              </span>
              <span className="font-extrabold text-slate-900 font-mono text-sm">
                {formatSize(totalBytes)} <span className="text-slate-400 font-normal text-xs">/ ~5.0 MB ({usedPercentage.toFixed(1)}%)</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  usedPercentage > 80 
                    ? 'bg-rose-500' 
                    : usedPercentage > 50 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.max(2, usedPercentage)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Standard web browsers allocate <strong>5 MB to 10 MB</strong> for local storage. This is plenty of space for hundreds of interview sessions, resumes, and tracked jobs.
            </p>
          </div>

          {/* Breakdown by Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category Breakdown
              </span>
              <button
                type="button"
                onClick={calculateStorage}
                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh Size</span>
              </button>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const hasData = cat.sizeBytes > 0;
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${hasData ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                          {cat.itemCount > 0 && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{cat.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {formatSize(cat.sizeBytes)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClearCategory(cat)}
                        disabled={!hasData}
                        title={`Delete ${cat.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Browser Clearing Instructions Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowManualGuide(!showManualGuide)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-600" />
                <span>How to clear storage manually in your browser</span>
              </div>
              {showManualGuide ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {showManualGuide && (
              <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-600 space-y-3 leading-relaxed">
                <div>
                  <strong className="text-slate-800">Google Chrome / Microsoft Edge:</strong>
                  <p className="mt-0.5">
                    1. Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">F12</kbd> (or Right-Click $\rightarrow$ <em>Inspect</em>).<br/>
                    2. Switch to the <strong>Application</strong> tab at the top.<br/>
                    3. Expand <strong>Storage</strong> $\rightarrow$ <strong>Local Storage</strong> on the left panel.<br/>
                    4. Click on your Ascent website URL, then right-click $\rightarrow$ <strong>Clear</strong>, or click the clear icon (<Trash2 className="h-3 w-3 inline" />).
                  </p>
                </div>

                <div>
                  <strong className="text-slate-800">Apple Safari (Mac):</strong>
                  <p className="mt-0.5">
                    1. Open Safari $\rightarrow$ <strong>Settings (or Preferences)</strong> $\rightarrow$ <strong>Privacy</strong> tab.<br/>
                    2. Click <strong>Manage Website Data...</strong><br/>
                    3. Search for your domain or Vercel URL, select it, and click <strong>Remove</strong>.
                  </p>
                </div>

                <div>
                  <strong className="text-slate-800">Mozilla Firefox:</strong>
                  <p className="mt-0.5">
                    1. Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">F12</kbd> $\rightarrow$ select the <strong>Storage</strong> tab.<br/>
                    2. Expand <strong>Local Storage</strong> $\rightarrow$ right-click your domain and select <strong>Delete All</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={totalBytes === 0}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Reset All Ascent Data</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
