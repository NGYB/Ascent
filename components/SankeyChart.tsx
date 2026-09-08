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

  // Flow Math setup
  const height = 300;
  const width = 980;
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
  const xOffers = 610;
  const xRejected = 750;

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
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
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
        <div className="relative overflow-x-auto select-none pt-2 pb-2 px-2">
          {isSample && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <span><strong>Sample Preview Mode:</strong> Showing simulated pipeline progression until you apply to jobs.</span>
              <button onClick={() => setShowSample(false)} className="underline font-bold text-amber-900 ml-2">Hide</button>
            </div>
          )}

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
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="interviewing-to-offers" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="interviewing-to-rejected" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="offers-to-rejected" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.25" />
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
                <title>{`Advanced to Interviews: ${interviewTotal}`}</title>
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
                className="hover:stroke-emerald-500/60 transition-colors cursor-pointer"
              >
                <title>{`Received Offers: ${offerTotal}`}</title>
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
                className="hover:stroke-rose-600/50 transition-colors cursor-pointer"
              >
                <title>{`Rejected after Interview: ${rejInterviewOnly}`}</title>
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
                className="hover:stroke-rose-600/50 transition-colors cursor-pointer"
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
                className="hover:stroke-rose-500/40 transition-colors cursor-pointer"
              >
                <title>{`Rejected after Applied: ${rejApplied}`}</title>
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
              <text x={xInterviewing - 12} y={yInterviewing + Math.min(16, hInterviewing / 2) + 16} className={`text-[10px] font-semibold ${interviewActive > 0 ? 'text-slate-500' : 'text-slate-400'}`} textAnchor="end">
                {interviewActive} pending reply
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
                className={offerTotal > 0 ? 'fill-emerald-500 shadow-sm' : 'fill-slate-200'}
              />
              <text x={xOffers + nodeWidth + 12} y={yOffers + Math.min(16, hOffers / 2) + 2} className={`text-xs font-bold ${offerActive > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                Offers ({offerActive})
              </text>
              <text x={xOffers + nodeWidth + 12} y={yOffers + Math.min(16, hOffers / 2) + 16} className={`text-[10px] font-semibold ${offerTotal > 0 ? 'text-emerald-600' : 'text-slate-400'}`} textAnchor="start">
                {rejOffer > 0 ? `${rejOffer} declined` : offerTotal > 0 ? `${offerTotal} received` : '0 offers'}
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
                className={rejInterviewTotal > 0 ? 'fill-rose-600 shadow-sm' : 'fill-slate-200'}
              />
              <text x={xRejected + nodeWidth + 12} y={yRejInterview + Math.min(16, hRejInterview / 2) + 2} className={`text-xs font-bold ${rejInterviewTotal > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                Rejected after interviewing ({rejInterviewTotal})
              </text>
              <text x={xRejected + nodeWidth + 12} y={yRejInterview + Math.min(16, hRejInterview / 2) + 16} className={`text-[10px] font-semibold ${rejInterviewTotal > 0 ? 'text-rose-600' : 'text-slate-400'}`} textAnchor="start">
                {rejInterviewTotal > 0 ? `${rejInterviewTotal} after interview` : '0 after interview'}
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
                className={rejApplied > 0 ? 'fill-rose-500 shadow-sm' : 'fill-slate-200'}
              />
              <text x={xRejected + nodeWidth + 12} y={yRejApplied + Math.min(16, hRejApplied / 2) + 2} className={`text-xs font-bold ${rejApplied > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                Rejected after applied ({rejApplied})
              </text>
              <text x={xRejected + nodeWidth + 12} y={yRejApplied + Math.min(16, hRejApplied / 2) + 16} className={`text-[10px] font-semibold ${rejApplied > 0 ? 'text-rose-500' : 'text-slate-400'}`} textAnchor="start">
                {rejApplied > 0 ? `${rejApplied} after applied` : '0 after applied'}
              </text>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
