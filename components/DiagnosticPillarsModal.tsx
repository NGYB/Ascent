'use client';

import React from 'react';
import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  BarChart3, 
  Zap, 
  FileText, 
  Target, 
  Info,
  Scale
} from 'lucide-react';
import { DIAGNOSTIC_PILLARS, PillarScoreBreakdown } from '@/lib/cv-diagnosis';

interface DiagnosticPillarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarScores?: PillarScoreBreakdown;
}

export default function DiagnosticPillarsModal({
  isOpen,
  onClose,
  pillarScores
}: DiagnosticPillarsModalProps) {
  if (!isOpen) return null;

  const pillarIcons: Record<string, React.ReactNode> = {
    impact: <BarChart3 className="h-5 w-5 text-indigo-600" />,
    verbs: <Zap className="h-5 w-5 text-amber-600" />,
    structure: <FileText className="h-5 w-5 text-emerald-600" />,
    competency: <Target className="h-5 w-5 text-blue-600" />
  };

  const getPillarScore = (id: string): number | undefined => {
    if (!pillarScores) return undefined;
    if (id === 'impact') return pillarScores.quantifiedImpact;
    if (id === 'verbs') return pillarScores.actionVerbs;
    if (id === 'structure') return pillarScores.structureParsability;
    if (id === 'competency') return pillarScores.competencyDepth;
    return undefined;
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-slate-400 bg-slate-100 border-slate-200';
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 sm:my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-modal-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
                  Methodology & Science
                </span>
                <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                  <Scale className="h-3 w-3 text-amber-300" />
                  Weighted ATS Scoring
                </span>
              </div>
              <h2 id="methodology-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>The 4 Diagnostic Pillars</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                How Ascent computes your baseline ATS health score before a target job is selected.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Informational Intro Banner */}
        <div className="p-4 sm:p-5 bg-indigo-50/70 border-b border-indigo-100 flex items-start gap-3 flex-shrink-0">
          <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-indigo-950 space-y-1 leading-relaxed">
            <p className="font-bold">
              Why compute an ATS score without a specific job description?
            </p>
            <p className="text-slate-600 text-xs">
              Recruitment systems (Workday, Taleo, Greenhouse) penalize poorly formatted, unquantified resumes before keyword matching even occurs. 
              Ascent evaluates universal <strong>ATS hygiene, outcome density, and executive vocabulary</strong> to give you a true baseline before tailoring.
            </p>
          </div>
        </div>

        {/* Scrollable Pillars Breakdown */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="grid grid-cols-1 gap-4">
            {DIAGNOSTIC_PILLARS.map((pillar) => {
              const currentScore = getPillarScore(pillar.id);

              return (
                <div 
                  key={pillar.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 mt-0.5">
                        {pillarIcons[pillar.id]}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {pillar.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Weight: {pillar.weight}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {pillar.subtitle}
                        </p>
                      </div>
                    </div>

                    {currentScore !== undefined && (
                      <div className="flex items-center gap-1.5 self-start">
                        <span className="text-[11px] text-slate-500 font-medium">Your Score:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getScoreColor(currentScore)}`}>
                          {currentScore} / 100
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      What the Algorithm Evaluates:
                    </span>
                    <ul className="space-y-1.5">
                      {pillar.whatWeLookFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded border border-amber-200/80 leading-relaxed">
                    <strong>💡 Why it matters: </strong>
                    <span>{pillar.whyItMatters}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Scores update automatically whenever you run a CV diagnosis.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
