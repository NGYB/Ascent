'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  Compass,
  ChevronsUp,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Radar,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';
import { APP_VERSION, APP_STAGE } from '@/lib/version';

const navItems = [
  { name: 'CV Workspace', href: '/cv', icon: FileText },
  { name: 'Smart Job Radar', href: '/radar', icon: Radar },
  { name: 'Tailoring & ATS', href: '/tailor', icon: Sparkles },
  { name: 'Interview Prep', href: '/interview', icon: MessageSquare },
  { name: 'Job Tracker', href: '/tracker', icon: Kanban },
  { name: 'Privacy & FAQ', href: '/faq', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <aside 
      className={cn(
        "hidden md:flex bg-slate-900 text-white flex-col h-full border-r border-slate-800 transition-all duration-300 ease-in-out relative z-30 flex-shrink-0 select-none",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header / Brand */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between gap-2 overflow-hidden flex-shrink-0">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer truncate",
            isCollapsed && "justify-center w-full px-0"
          )}
          title={`Ascent (${APP_STAGE} v${APP_VERSION}) - Home`}
        >
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <ChevronsUp className="h-5 w-5 text-indigo-400" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent truncate leading-none">
                ASCENT
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 leading-none">
                  {APP_STAGE}
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-none">
                  v{APP_VERSION}
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Collapse Button when Expanded */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Collapse sidebar (Cmd+B / Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center rounded-lg transition-colors text-sm font-medium group relative",
                isCollapsed 
                  ? "px-0 py-3 justify-center" 
                  : "px-3.5 py-2.5 gap-3",
                isActive 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed ? (
                <span className="truncate">{item.name}</span>
              ) : (
                /* Tooltip for collapsed mode */
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer info & Toggle */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <Compass className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-300 truncate">Trial / Guest Mode</p>
                <p className="text-[10px] text-slate-500 truncate">Progress saved locally • v{APP_VERSION}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors"
              title="Collapse sidebar (Cmd+B / Ctrl+B)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Collapse Sidebar</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 group relative">
            <div 
              className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center cursor-pointer"
              title={`Trial / Guest Mode: Progress saved locally (v${APP_VERSION})`}
            >
              <Compass className="h-4 w-4 text-indigo-400" />
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Expand sidebar (Cmd+B / Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute left-full bottom-2 ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
              Expand Sidebar (Cmd+B)
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
