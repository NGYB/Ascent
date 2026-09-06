'use client';

import { usePathname } from 'next/navigation';
import { UserCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function Header() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();

  // Map pathnames to clean titles
  const getTitle = () => {
    if (pathname.startsWith('/cv')) return 'CV Workspace';
    if (pathname.startsWith('/tailor')) return 'Tailoring & ATS Scorecard';
    if (pathname.startsWith('/interview')) return 'Mock Interview Room';
    if (pathname.startsWith('/tracker')) return 'Application Pipeline';
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand sidebar (Cmd+B / Ctrl+B)" : "Collapse sidebar (Cmd+B / Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-indigo-600" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <div className="h-5 w-[1px] bg-slate-200" />

        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
          {getTitle()}
        </h1>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-2">
          <UserCheck className="h-3 w-3" />
          <span>Local Session</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden lg:inline-block text-[11px] text-slate-400 font-medium">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 text-[10px] font-mono">⌘B</kbd> to toggle panel
        </span>
      </div>
    </header>
  );
}
