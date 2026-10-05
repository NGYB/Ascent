'use client';

import React, { useState } from 'react';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'DRAFT' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';
  rejectedFromStage?: 'APPLIED' | 'INTERVIEWING' | 'OFFER';
  updatedAt: string;
}

interface SankeyChartProps {
  apps: Application[];
}

export default function SankeyChart({ apps }: SankeyChartProps) {
  const [showSample, setShowSample] = useState(false);

  // Filter out DRAFT state to focus on active steps: Applied, Interviewing, Offers, Archived/Reject
  const activeApps = apps.filter((a) => a.status !== 'DRAFT');

  // Compute exact real counts
  const cApplied = activeApps.filter((a) => a.status === 'APPLIED').length;
  const cInterviewing = activeApps.filter((a) => a.status === 'INTERVIEWING').length;
  const cOffer = activeApps.filter((a) => a.status === 'OFFER').length;

  // Breakdown of rejections by origin stage:
  // 1. Rejected after applied
  const cRejectedApplied = activeApps.filter(
    (a) => a.status === 'REJECTED' && (a.rejectedFromStage === 'APPLIED' || !a.rejectedFromStage)
  ).length;

  // 2. Rejected after interviewing (includes any offer-stage rejections)
  const cRejectedInterview = activeApps.filter(
    (a) => a.status === 'REJECTED' && a.rejectedFromStage === 'INTERVIEWING'
  ).length;
  const cRejectedOffer = activeApps.filter(
    (a) => a.status === 'REJECTED' && a.rejectedFromStage === 'OFFER'
  ).length;

  const totalRejectedInterview = cRejectedInterview + cRejectedOffer;
  const totalRejected = cRejectedApplied + totalRejectedInterview;

  const totalInterviewStage = cInterviewing + cOffer + totalRejectedInterview;
  const totalApplied = cApplied + totalInterviewStage + cRejectedApplied;

  const hasRealData = totalApplied > 0;
  const isSample = !hasRealData && showSample;

  // Sample data fallback values (only used if explicitly toggled on when empty)
  const effectiveTotal = isSample ? 12 : totalApplied;
  const appliedActive = isSample ? 4 : cApplied;
  const interviewTotal = isSample ? 5 : totalInterviewStage;
  const interviewActive = isSample ? 2 : cInterviewing;
  const offerActive = isSample ? 2 : cOffer;
  const offerTotal = isSample ? 2 : (cOffer + cRejectedOffer);
  const rejApplied = isSample ? 3 : cRejectedApplied;
  const rejInterviewOnly = isSample ? 1 : cRejectedInterview;
  const rejOffer = isSample ? 0 : cRejectedOffer;
  const rejInterviewTotal = isSample ? 1 : totalRejectedInterview;

  // Percentage Calculations for Funnel Progression
  const pctInterviewed = effectiveTotal > 0 ? Math.round((interviewTotal / effectiveTotal) * 100) : 0;
  const pctOffers = interviewTotal > 0 ? Math.round((offerTotal / interviewTotal) * 100) : 0;
  const pctRejectedInterview = interviewTotal > 0 ? Math.round((rejInterviewTotal / interviewTotal) * 100) : 0;
  const pctRejectedApplied = effectiveTotal > 0 ? Math.round((rejApplied / effectiveTotal) * 100) : 0;

  // Flow Math setup
  const height = 300;
  const width = 1000;
  const topPadding = 28;
  const bottomPadding = 32;
  const nodeWidth = 14;

  const totalActive = Math.max(1, effectiveTotal);
  const scale = (height - topPadding - bottomPadding) / Math.max(totalActive * 1.25, 8);

  // Node heights
  const hApplied = Math.max(effectiveTotal * scale, effectiveTotal > 0 ? 14 : 8);
  const hInterviewing = Math.max(interviewTotal * scale, interviewTotal > 0 ? 14 : 8);
  const hOffers = Math.max(offerTotal * scale, offerTotal > 0 ? 14 : 8);
  const hRejInterview = Math.max(rejInterviewTotal * scale, rejInterviewTotal > 0 ? 14 : 8);
  const hRejApplied = Math.max(rejApplied * scale, rejApplied > 0 ? 14 : 8);

  // Node positions
  const xApplied = 140;
  const xInterviewing = 385;
  const xOffers = 600;
  const xRejected = 760;

  const yApplied = topPadding;
  const yInterviewing = topPadding + (appliedActive * scale * 0.3);
  const yOffers = yInterviewing + (interviewActive * scale * 0.3);

  // Staggered rejection stages to ensure completely separate, non-overlapping paths
  const yRejInterview = Math.max(yOffers + hOffers + 28, topPadding + hApplied * 0.55);
  const yRejApplied = yRejInterview + Math.max(hRejInterview, 24) + 26;

  // Helper to generate SVG cubic Bezier path between two points
  const getSankeyPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cpX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cpX} ${y1}, ${cpX} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Application Funnel (Sankey Flow)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visualizing status progression from initial application to interviews, offers, and rejections.
          </p>
        </div>
        
        {!hasRealData ? (
          <button
            type="button"
            onClick={() => setShowSample(!showSample)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {showSample ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide Sample Data</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Preview Sample Flow</span>
              </>
            )}
          </button>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-bold uppercase tracking-wider">
            Live Conversion Pipeline
          </span>
        )}
      </div>

      {!hasRealData && !showSample ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Funnel Awaiting Active Applications</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Move opportunities from <strong>Draft / Tailored</strong> to <strong>Applied</strong> to track your conversion rate from application to interview, offers, and archive.
          </p>
        </div>
      ) : (
        <div className="relative select-none pt-1 pb-2 px-1 space-y-4">
          {/* Conversion Rates KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Interview Rate</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{pctInterviewed}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {interviewTotal} of {effectiveTotal} applied
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Offer Rate</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{interviewTotal > 0 ? `${pctOffers}%` : '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {interviewTotal > 0 ? `${offerTotal} of ${interviewTotal} interviewed` : 'Awaiting interviews'}
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Initial Screen Drop-off</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{pctRejectedApplied}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {rejApplied} of {effectiveTotal} rejected after applied
              </div>
            </div>

            <div className="bg-orange-50/70 border border-orange-100 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Post-Interview Drop-off</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{interviewTotal > 0 ? `${pctRejectedInterview}%` : '—'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {interviewTotal > 0 ? `${rejInterviewTotal} of ${interviewTotal} rejected after interview` : 'Awaiting interviews'}
              </div>
            </div>
          </div>

          {isSample && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <span><strong>Sample Preview Mode:</strong> Showing simulated pipeline progression until you apply to jobs.</span>
              <button onClick={() => setShowSample(false)} className="underline font-bold text-amber-900 ml-2">Hide</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full min-w-[760px] h-fit"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Gradients for links */}
                <linearGradient id="applied-to-interviewing" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="applied-to-rejected" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="interviewing-to-offers" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="interviewing-to-rejected" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="offers-to-rejected" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* --- LINKS / PATHS --- */}
              {/* Link 1: Applied -> Interviewing */}
              {interviewTotal > 0 && (
                <path
                  d={getSankeyPath(
                    xApplied + nodeWidth,
                    yApplied + (appliedActive * scale) + (interviewTotal * scale / 2),
                    xInterviewing,
                    yInterviewing + (interviewTotal * scale / 2)
                  )}
                  fill="none"
                  stroke="url(#applied-to-interviewing)"
                  strokeWidth={Math.max(2, interviewTotal * scale)}
                  className="hover:stroke-indigo-500/50 transition-colors cursor-pointer"
                >
                  <title>{`Advanced to Interviews: ${interviewTotal} (${pctInterviewed}% of applied)`}</title>
                </path>
              )}

              {/* Link 2: Interviewing -> Offers */}
              {offerTotal > 0 && (
                <path
                  d={getSankeyPath(
                    xInterviewing + nodeWidth,
                    yInterviewing + (interviewActive * scale) + (offerTotal * scale / 2),
                    xOffers,
                    yOffers + (offerTotal * scale / 2)
                  )}
                  fill="none"
                  stroke="url(#interviewing-to-offers)"
                  strokeWidth={Math.max(2, offerTotal * scale)}
                  className="hover:stroke-blue-500/60 transition-colors cursor-pointer"
                >
                  <title>{`Received Offers: ${offerTotal} (${pctOffers}% of interviewed)`}</title>
                </path>
              )}

              {/* Link 3: Interviewing -> Rejected after interviewing */}
              {rejInterviewOnly > 0 && (
                <path
                  d={getSankeyPath(
                    xInterviewing + nodeWidth,
                    yInterviewing + (interviewActive + offerTotal) * scale + (rejInterviewOnly * scale / 2),
                    xRejected,
                    yRejInterview + (rejInterviewOnly * scale / 2)
                  )}
                  fill="none"
                  stroke="url(#interviewing-to-rejected)"
                  strokeWidth={Math.max(2, rejInterviewOnly * scale)}
                  className="hover:stroke-orange-500/50 transition-colors cursor-pointer"
                >
                  <title>{`Rejected after Interview: ${rejInterviewOnly} (${pctRejectedInterview}% of interviewed)`}</title>
                </path>
              )}

              {/* Link 4: Offers -> Rejected after interviewing (if any offer declined/rejected) */}
              {rejOffer > 0 && (
                <path
                  d={getSankeyPath(
                    xOffers + nodeWidth,
                    yOffers + (offerActive * scale) + (rejOffer * scale / 2),
                    xRejected,
                    yRejInterview + (rejInterviewOnly * scale) + (rejOffer * scale / 2)
                  )}
                  fill="none"
                  stroke="url(#offers-to-rejected)"
                  strokeWidth={Math.max(2, rejOffer * scale)}
                  className="hover:stroke-orange-500/50 transition-colors cursor-pointer"
                >
                  <title>{`Declined / Rejected at Offer: ${rejOffer}`}</title>
                </path>
              )}

              {/* Link 5: Applied -> Rejected after applied */}
              {rejApplied > 0 && (
                <path
                  d={getSankeyPath(
                    xApplied + nodeWidth,
                    yApplied + (appliedActive + interviewTotal) * scale + (rejApplied * scale / 2),
                    xRejected,
                    yRejApplied + (rejApplied * scale / 2)
                  )}
                  fill="none"
                  stroke="url(#applied-to-rejected)"
                  strokeWidth={Math.max(2, rejApplied * scale)}
                  className="hover:stroke-amber-500/40 transition-colors cursor-pointer"
                >
                  <title>{`Rejected after Applied: ${rejApplied} (${pctRejectedApplied}% of applied)`}</title>
                </path>
              )}

              {/* --- NODES (Rectangles & Exact Labels) --- */}
              {/* Node 1: Total applied */}
              <g>
                <rect
                  x={xApplied}
                  y={yApplied}
                  width={nodeWidth}
                  height={hApplied}
                  rx={3}
                  className="fill-blue-500 shadow-sm"
                />
                <text x={xApplied - 12} y={yApplied + Math.min(16, hApplied / 2) + 2} className="text-xs font-bold text-slate-800" textAnchor="end">
                  Total applied ({effectiveTotal})
                </text>
                <text x={xApplied - 12} y={yApplied + Math.min(16, hApplied / 2) + 16} className="text-[10px] font-semibold text-slate-500" textAnchor="end">
                  {appliedActive} pending reply
                </text>
              </g>

              {/* Node 2: Interviewed */}
              <g>
                <rect
                  x={xInterviewing}
                  y={yInterviewing}
                  width={nodeWidth}
                  height={hInterviewing}
                  rx={3}
                  className={interviewTotal > 0 ? 'fill-indigo-500 shadow-sm' : 'fill-slate-200'}
                />
                <text x={xInterviewing - 12} y={yInterviewing + Math.min(16, hInterviewing / 2) + 2} className={`text-xs font-bold ${interviewTotal > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="end">
                  Interviewed ({interviewTotal})
                </text>
                <text x={xInterviewing - 12} y={yInterviewing + Math.min(16, hInterviewing / 2) + 16} className={`text-[10px] font-semibold ${interviewTotal > 0 ? 'text-indigo-600' : 'text-slate-400'}`} textAnchor="end">
                  {effectiveTotal > 0 ? `${pctInterviewed}% of applied` : '0%'}{interviewActive > 0 ? ` · ${interviewActive} active` : ''}
                </text>
              </g>

              {/* Node 3: Offers */}
              <g>
                <rect
                  x={xOffers}
                  y={yOffers}
                  width={nodeWidth}
                  height={hOffers}
                  rx={3}
                  className={offerTotal > 0 ? 'fill-blue-600 shadow-sm' : 'fill-slate-200'}
                />
                <text x={xOffers + nodeWidth + 12} y={yOffers + Math.min(16, hOffers / 2) + 2} className={`text-xs font-bold ${offerActive > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                  Offers ({offerActive})
                </text>
                <text x={xOffers + nodeWidth + 12} y={yOffers + Math.min(16, hOffers / 2) + 16} className={`text-[10px] font-semibold ${offerTotal > 0 ? 'text-blue-700' : 'text-slate-400'}`} textAnchor="start">
                  {interviewTotal > 0 ? `${pctOffers}% of interviewed` : '0%'}{rejOffer > 0 ? ` · ${rejOffer} declined` : ''}
                </text>
              </g>

              {/* Node 4: Rejected after interviewing */}
              <g>
                <rect
                  x={xRejected}
                  y={yRejInterview}
                  width={nodeWidth}
                  height={hRejInterview}
                  rx={3}
                  className={rejInterviewTotal > 0 ? 'fill-amber-600 shadow-sm' : 'fill-slate-200'}
                />
                <text x={xRejected + nodeWidth + 12} y={yRejInterview + Math.min(16, hRejInterview / 2) + 2} className={`text-xs font-bold ${rejInterviewTotal > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                  Rejected after interviewing ({rejInterviewTotal})
                </text>
                <text x={xRejected + nodeWidth + 12} y={yRejInterview + Math.min(16, hRejInterview / 2) + 16} className={`text-[10px] font-semibold ${rejInterviewTotal > 0 ? 'text-amber-800' : 'text-slate-400'}`} textAnchor="start">
                  {interviewTotal > 0 ? `${pctRejectedInterview}% of interviewed` : '0% of interviewed'}
                </text>
              </g>

              {/* Node 5: Rejected after applied */}
              <g>
                <rect
                  x={xRejected}
                  y={yRejApplied}
                  width={nodeWidth}
                  height={hRejApplied}
                  rx={3}
                  className={rejApplied > 0 ? 'fill-amber-500 shadow-sm' : 'fill-slate-200'}
                />
                <text x={xRejected + nodeWidth + 12} y={yRejApplied + Math.min(16, hRejApplied / 2) + 2} className={`text-xs font-bold ${rejApplied > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                  Rejected after applied ({rejApplied})
                </text>
                <text x={xRejected + nodeWidth + 12} y={yRejApplied + Math.min(16, hRejApplied / 2) + 16} className={`text-[10px] font-semibold ${rejApplied > 0 ? 'text-amber-800' : 'text-slate-400'}`} textAnchor="start">
                  {effectiveTotal > 0 ? `${pctRejectedApplied}% of applied` : '0% of applied'}
                </text>
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
