'use client';

import { useState, useEffect } from 'react';
import SankeyChart from '@/components/SankeyChart';
import { 
  Kanban, 
  Plus, 
  Trash2, 
  Briefcase, 
  FileText,
  Calendar,
  MoveRight,
  MoveLeft,
  ChevronsRight,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'DRAFT' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';
  rejectedFromStage?: 'APPLIED' | 'INTERVIEWING' | 'OFFER';
  tailoredResumeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TailoredResumeItem {
  id: string;
  jobTitle: string;
  company: string;
  tailoredResume: string;
  createdAt: string;
}

const COLUMNS: { id: Application['status']; name: string; color: string; bg: string }[] = [
  { id: 'DRAFT', name: 'Draft / Tailored', color: 'text-indigo-700 border-indigo-200', bg: 'bg-indigo-50/50' },
  { id: 'APPLIED', name: 'Applied', color: 'text-amber-700 border-amber-200', bg: 'bg-amber-50/50' },
  { id: 'INTERVIEWING', name: 'Interviewing', color: 'text-blue-700 border-blue-200', bg: 'bg-blue-50/50' },
  { id: 'OFFER', name: 'Offers', color: 'text-emerald-700 border-emerald-200', bg: 'bg-emerald-50/50' },
  { id: 'REJECTED', name: 'Archived / Reject', color: 'text-slate-500 border-slate-200', bg: 'bg-slate-50/50' }
];

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResumeItem[]>([]);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStatus, setNewStatus] = useState<Application['status']>('DRAFT');
  const [newRejectedStage, setNewRejectedStage] = useState<'APPLIED' | 'INTERVIEWING' | 'OFFER'>('APPLIED');
  const [selectedResume, setSelectedResume] = useState('');

  useEffect(() => {
    // Load from local storage
    try {
      const savedApps = JSON.parse(localStorage.getItem('ascent_applications') || '[]');
      setApps(savedApps);

      const savedResumes = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      setTailoredResumes(savedResumes);
    } catch {}
  }, []);

  const saveApps = (newApps: Application[]) => {
    setApps(newApps);
    localStorage.setItem('ascent_applications', JSON.stringify(newApps));
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCompany) return;

    const newApp: Application = {
      id: crypto.randomUUID(),
      jobTitle: newTitle,
      company: newCompany,
      status: newStatus,
      rejectedFromStage: newStatus === 'REJECTED' ? newRejectedStage : undefined,
      tailoredResumeId: selectedResume || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...apps, newApp];
    saveApps(updated);
    
    // Reset form
    setNewTitle('');
    setNewCompany('');
    setNewStatus('DRAFT');
    setNewRejectedStage('APPLIED');
    setSelectedResume('');
    setShowAddModal(false);
  };

  const handleMove = (id: string, direction: 'left' | 'right') => {
    const app = apps.find(a => a.id === id);
    if (!app) return;

    const statusIndex = COLUMNS.findIndex(c => c.id === app.status);
    let nextIndex = statusIndex;

    if (direction === 'left' && statusIndex > 0) {
      nextIndex = statusIndex - 1;
    } else if (direction === 'right' && statusIndex < COLUMNS.length - 1) {
      nextIndex = statusIndex + 1;
    }

    if (nextIndex !== statusIndex) {
      const nextStatus = COLUMNS[nextIndex].id;
      const updated = apps.map(a => {
        if (a.id !== id) return a;
        let rejStage = a.rejectedFromStage;
        if (nextStatus === 'REJECTED' && !rejStage) {
          rejStage = (a.status === 'INTERVIEWING' || a.status === 'OFFER') ? a.status : 'APPLIED';
        }
        return {
          ...a,
          status: nextStatus,
          rejectedFromStage: nextStatus === 'REJECTED' ? rejStage : undefined,
          updatedAt: new Date().toISOString()
        };
      });
      saveApps(updated);
    }
  };

  const handleChangeStatus = (id: string, newStatus: Application['status'], explicitRejectionStage?: 'APPLIED' | 'INTERVIEWING' | 'OFFER') => {
    const updated = apps.map(a => {
      if (a.id !== id) return a;
      let rejStage = explicitRejectionStage || a.rejectedFromStage;
      if (newStatus === 'REJECTED' && !rejStage) {
        rejStage = (a.status === 'INTERVIEWING' || a.status === 'OFFER') ? a.status : 'APPLIED';
      }
      return {
        ...a,
        status: newStatus,
        rejectedFromStage: newStatus === 'REJECTED' ? rejStage : undefined,
        updatedAt: new Date().toISOString()
      };
    });
    saveApps(updated);
  };

  const handleSetRejectedStage = (id: string, stage: 'APPLIED' | 'INTERVIEWING' | 'OFFER') => {
    const updated = apps.map(a => 
      a.id === id ? { ...a, rejectedFromStage: stage, updatedAt: new Date().toISOString() } : a
    );
    saveApps(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this application entry?')) {
      const updated = apps.filter(a => a.id !== id);
      saveApps(updated);
    }
  };

  const getCVName = (resumeId?: string) => {
    if (!resumeId) return null;
    const resume = tailoredResumes.find(r => r.id === resumeId);
    return resume ? resume.jobTitle : null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Application Pipeline</h2>
          <p className="text-slate-500 text-sm">
            Track and manage your target opportunities. Cards generated during tailoring automatically appear here.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Sankey Flow Visualization */}
      <SankeyChart apps={apps} />

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col.id);
          return (
            <div key={col.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-[200px] h-[550px]">
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                <span className="font-bold text-xs text-slate-700 tracking-wide uppercase">
                  {col.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                  {colApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-slate-50/30">
                {colApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-center p-4">
                    <Briefcase className="h-6 w-6 stroke-[1.2] mb-1" />
                    <span className="text-[10px] italic">No jobs in this stage</span>
                  </div>
                ) : (
                  colApps.map((app) => {
                    const matchedCV = getCVName(app.tailoredResumeId);
                    return (
                      <div key={app.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between group gap-3 relative">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-slate-800 leading-tight pr-6">
                            {app.jobTitle}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">{app.company}</p>
                        </div>

                        {matchedCV && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 bg-indigo-50/60 border border-indigo-100 rounded px-1.5 py-0.5 w-fit">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{matchedCV}</span>
                          </div>
                        )}

                        {/* If REJECTED, show which stage it was rejected from with interactive selector */}
                        {app.status === 'REJECTED' && (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Rejected at:
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                (app.rejectedFromStage === 'APPLIED' || !app.rejectedFromStage)
                                  ? 'bg-amber-100 text-amber-800'
                                  : app.rejectedFromStage === 'INTERVIEWING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {(app.rejectedFromStage === 'APPLIED' || !app.rejectedFromStage) ? 'Screening' : app.rejectedFromStage === 'INTERVIEWING' ? 'Interview' : 'Offer'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetRejectedStage(app.id, 'APPLIED')}
                                className={`px-1 py-1 text-[9px] font-semibold rounded text-center transition-all ${
                                  (app.rejectedFromStage === 'APPLIED' || !app.rejectedFromStage)
                                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                              >
                                Screening
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRejectedStage(app.id, 'INTERVIEWING')}
                                className={`px-1 py-1 text-[9px] font-semibold rounded text-center transition-all ${
                                  app.rejectedFromStage === 'INTERVIEWING'
                                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                              >
                                Interview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRejectedStage(app.id, 'OFFER')}
                                className={`px-1 py-1 text-[9px] font-semibold rounded text-center transition-all ${
                                  app.rejectedFromStage === 'OFFER'
                                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                              >
                                Offer
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card Footer: Quick status switch & Column movements */}
                        <div className="space-y-2 border-t border-slate-100 pt-2">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Direct stage dropdown */}
                            <select
                              value={app.status}
                              onChange={(e) => handleChangeStatus(app.id, e.target.value as Application['status'])}
                              className="text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer flex-1"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>

                            {/* Quick Reject Button if not rejected */}
                            {app.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleChangeStatus(app.id, 'REJECTED')}
                                className="text-[10px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                title="Move directly to Archived / Reject"
                              >
                                Reject
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            {/* Board Transitions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMove(app.id, 'left')}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                                title="Move Left"
                              >
                                <MoveLeft className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleMove(app.id, 'right')}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                                title="Move Right"
                              >
                                <MoveRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Delete absolute button */}
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          title="Delete Card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Add Job Opportunity</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddApp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Job Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Director of Operations"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Application['status'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  {COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'REJECTED' && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-700">Rejected at Stage</label>
                  <select
                    value={newRejectedStage}
                    onChange={(e) => setNewRejectedStage(e.target.value as 'APPLIED' | 'INTERVIEWING' | 'OFFER')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="APPLIED">Screening / Resume</option>
                    <option value="INTERVIEWING">Interview Stage</option>
                    <option value="OFFER">Offer Stage</option>
                  </select>
                  <p className="text-[11px] text-slate-400">Specifies at which funnel step the application was archived.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Linked Tailored CV (Optional)</label>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">-- None --</option>
                  {tailoredResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.jobTitle} ({new Date(resume.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Save Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
