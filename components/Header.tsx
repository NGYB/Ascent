'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserCheck, PanelLeftClose, PanelLeftOpen, HardDrive, MessageSquarePlus, Eye, ChevronsUp, HelpCircle } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import StorageManagerModal from '@/components/StorageManagerModal';
import FeedbackModal from '@/components/FeedbackModal';

export default function Header() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { isColorblindMode, toggleColorblindMode } = useAccessibility();
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Map pathnames to clean titles
  const getTitle = () => {
    if (pathname.startsWith('/cv')) return 'CV Workspace';
    if (pathname.startsWith('/radar')) return 'Smart Job Radar';
    if (pathname.startsWith('/tailor')) return 'Tailoring & ATS';
    if (pathname.startsWith('/interview')) return 'Mock Interview Room';
    if (pathname.startsWith('/tracker')) return 'Application Pipeline';
    if (pathname.startsWith('/faq')) return 'Privacy & FAQ';
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-sand-200 bg-white flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-2xs flex-shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden md:inline-flex p-2 rounded-xl text-ink-500 hover:text-ink-900 hover:bg-sand-100 transition-colors cursor-pointer flex-shrink-0"
          title={isCollapsed ? "Expand sidebar (Cmd+B / Ctrl+B)" : "Collapse sidebar (Cmd+B / Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-terracotta-600" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        {/* Mobile Brand Link to Home */}
        <Link 
          href="/" 
          className="md:hidden flex items-center gap-1.5 flex-shrink-0 hover:opacity-85 transition-opacity"
          title="Ascent Dashboard"
        >
          <div className="h-8 w-8 rounded-lg bg-terracotta-500/15 border border-terracotta-500/30 flex items-center justify-center flex-shrink-0">
            <ChevronsUp className="h-4.5 w-4.5 text-terracotta-600" />
          </div>
        </Link>

        <div className="hidden md:block h-5 w-[1px] bg-sand-200" />

        <h1 className="text-base sm:text-lg md:text-xl font-bold text-ink-900 tracking-tight truncate">
          {getTitle()}
        </h1>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sand-100 text-ink-700 border border-sand-200 ml-2">
          <UserCheck className="h-3.5 w-3.5 text-pine-700" />
          <span>Local Session</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Colorblind / High-Contrast Mode Toggle */}
        <button
          type="button"
          onClick={toggleColorblindMode}
          className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
            isColorblindMode
              ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
              : 'text-ink-700 hover:text-terracotta-700 bg-sand-100/70 hover:bg-terracotta-50 border-sand-200 hover:border-terracotta-200'
          }`}
          title={isColorblindMode ? "Colorblind Mode is ON (Click to switch to standard)" : "Enable Colorblind-Friendly & High-Contrast Mode"}
          aria-pressed={isColorblindMode}
          aria-label={isColorblindMode ? "Colorblind Mode is ON" : "Enable Colorblind Mode"}
        >
          <Eye className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isColorblindMode ? 'text-white' : 'text-ink-500'}`} />
          <span className="hidden sm:inline">{isColorblindMode ? 'Colorblind: ON' : 'Colorblind'}</span>
        </button>

        {/* Privacy & FAQ Link */}
        <Link
          href="/faq"
          className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
            pathname === '/faq'
              ? 'bg-terracotta-600 text-white border-terracotta-700 shadow-xs'
              : 'text-ink-700 hover:text-terracotta-700 bg-sand-100/70 hover:bg-terracotta-50 border-sand-200 hover:border-terracotta-200'
          }`}
          title="Privacy & AI Architecture FAQ"
          aria-label="Privacy and AI FAQ"
        >
          <HelpCircle className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${pathname === '/faq' ? 'text-white' : 'text-ink-500'}`} />
          <span className="hidden sm:inline">FAQ</span>
        </Link>

        {/* Feedback Button */}
        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-ink-700 hover:text-terracotta-700 bg-sand-100/70 hover:bg-terracotta-50 border border-sand-200 hover:border-terracotta-200 transition-all cursor-pointer shadow-2xs group"
          title="Share feedback or report an issue"
          aria-label="Share feedback"
        >
          <MessageSquarePlus className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-ink-500 group-hover:text-terracotta-700 transition-colors" />
          <span className="hidden sm:inline">Feedback</span>
        </button>

        {/* Storage Manager Button */}
        <button
          type="button"
          onClick={() => setIsStorageModalOpen(true)}
          className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-ink-700 hover:text-terracotta-700 bg-sand-100/70 hover:bg-terracotta-50 border border-sand-200 hover:border-terracotta-200 transition-all cursor-pointer shadow-2xs group"
          title="Manage locally stored data & privacy"
          aria-label="Manage storage and privacy"
        >
          <HardDrive className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-ink-500 group-hover:text-terracotta-700 transition-colors" />
          <span className="hidden sm:inline">Storage</span>
        </button>

        <span className="hidden lg:inline-block text-[11px] text-ink-400 font-medium">
          Press <kbd className="px-1.5 py-0.5 bg-sand-100 border border-sand-200 rounded text-ink-500 text-[10px] font-mono">⌘B</kbd> to toggle panel
        </span>
      </div>

      <StorageManagerModal 
        isOpen={isStorageModalOpen} 
        onClose={() => setIsStorageModalOpen(false)} 
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </header>
  );
}
