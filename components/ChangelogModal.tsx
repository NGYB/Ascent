'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  MessageSquareQuote, 
  MessageSquarePlus, 
  Clock, 
  Rocket, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  CHANGELOG_RELEASES, 
  Release, 
  ChangelogItem,
  markChangelogAsRead 
} from '@/lib/changelog';
import { APP_STAGE, APP_VERSION } from '@/lib/version';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
}

type FilterOption = 'all' | 'feedback' | 'roadmap';

export default function ChangelogModal({ isOpen, onClose, onOpenFeedback }: ChangelogModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  useEffect(() => {
    if (isOpen) {
      markChangelogAsRead();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter items in each release
  const filteredReleases = CHANGELOG_RELEASES.map(release => {
    const items = release.items.filter(item => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'feedback') return item.source === 'feedback';
      if (activeFilter === 'roadmap') return item.source === 'roadmap';
      return true;
    });
    return { ...release, items };
  }).filter(release => release.items.length > 0);

  const totalFeedbackItems = CHANGELOG_RELEASES.reduce((acc, r) => 
    acc + r.items.filter(i => i.source === 'feedback').length, 0
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-2xl 2xl:max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 sm:my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-modal-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-amber-400 text-slate-950">
                  {APP_STAGE} v{APP_VERSION}
                </span>
                <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  Continuous Improvement
                </span>
              </div>
              <h2 id="changelog-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>What&apos;s New in Ascent</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Track our continuous product updates, with dedicated recognition for features built directly from user feedback.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              title="Close changelog"
              aria-label="Close changelog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-indigo-900/50 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Updates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'feedback'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
              <span>Shipped from User Feedback</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-200 font-extrabold ml-0.5">
                {totalFeedbackItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'roadmap'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              <Rocket className="h-3.5 w-3.5 text-indigo-300" />
              <span>Core Roadmap</span>
            </button>
          </div>
        </div>

        {/* Scrollable Changelog Timeline */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 bg-slate-50/50">
          {filteredReleases.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <Lightbulb className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No updates match this filter</p>
              <p className="text-xs text-slate-500">Switch to &quot;All Updates&quot; to view every release note.</p>
            </div>
          ) : (
            filteredReleases.map((release, releaseIdx) => (
              <div key={release.version} className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-4">
                {/* Timeline node */}
                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 ${
                  release.isLatest 
                    ? 'bg-indigo-600 border-white ring-4 ring-indigo-100 shadow-xs' 
                    : 'bg-slate-300 border-white ring-2 ring-slate-100'
                }`} />

                {/* Release Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      v{release.version}
                    </span>
                    {release.isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                        Latest Release
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {release.releaseDate}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    {release.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {release.summary}
                  </p>
                </div>

                {/* Release Items */}
                <div className="space-y-3 pt-1">
                  {release.items.map((item) => {
                    const isFeedback = item.source === 'feedback';

                    return (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isFeedback
                            ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs hover:border-amber-300'
                            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{item.title}</span>
                          </h4>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isFeedback ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xs">
                                <Lightbulb className="h-3 w-3" />
                                <span>Shipped from User Feedback</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span>Core Roadmap</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* User Feedback Callout Quote */}
                        {item.feedbackQuote && (
                          <div className="bg-amber-50/90 border-l-3 border-amber-500 rounded-r-lg p-2.5 my-2.5 flex items-start gap-2 text-xs text-amber-950 shadow-2xs">
                            <MessageSquareQuote className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                                Candidate Request:
                              </span>
                              <p className="italic font-medium leading-relaxed">
                                &ldquo;{item.feedbackQuote}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {item.description}
                        </p>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap">
                            {item.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Feedback Hook */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 text-center sm:text-left">
            <MessageSquarePlus className="h-4 w-4 text-indigo-600 flex-shrink-0 hidden sm:inline" />
            <span>
              Have an idea or spotted a bug? We read every submission and build directly from your feedback.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Submit Feedback</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
