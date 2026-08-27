'use client';

import { usePathname } from 'next/navigation';
import { Sparkles, Save, UserCheck, AlertCircle } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  // Map pathnames to clean titles
  const getTitle = () => {
    if (pathname.startsWith('/cv')) return 'CV Workspace';
    if (pathname.startsWith('/tailor')) return 'Tailoring & ATS Scorecard';
    if (pathname.startsWith('/interview')) return 'Mock Interview Room';
    if (pathname.startsWith('/tracker')) return 'Application Pipeline';
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          {getTitle()}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <UserCheck className="h-3 w-3" />
          <span>Local Session (Data Stored in Browser)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Save Progress removed */}
      </div>
    </header>
  );
}
