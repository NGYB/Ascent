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

  // Breakdown of rejections by origin stage
  const cRejectedScreen = activeApps.filter(
    (a) => a.status === 'REJECTED' && (a.rejectedFromStage === 'APPLIED' || !a.rejectedFromStage)
  ).length;
  const cRejectedInterview = activeApps.filter(
    (a) => a.status === 'REJECTED' && a.rejectedFromStage === 'INTERVIEWING'
  ).length;
  const cRejectedOffer = activeApps.filter(
    (a) => a.status === 'REJECTED' && a.rejectedFromStage === 'OFFER'
  ).length;
  const totalRejected = cRejectedScreen + cRejectedInterview + cRejectedOffer;

  const totalInterviewStage = cInterviewing + cOffer + cRejectedInterview + cRejectedOffer;
  const totalApplied = cApplied + totalInterviewStage + cRejectedScreen;

  const hasRealData = totalApplied > 0;
  const isSample = !hasRealData && showSample;

  // Sample data fallback values (only used if explicitly toggled on when empty)
  const effectiveTotal = isSample ? 12 : totalApplied;
  const appliedActive = isSample ? 4 : cApplied;
  const interviewTotal = isSample ? 5 : totalInterviewStage;
  const interviewActive = isSample ? 2 : cInterviewing;
  const offerActive = isSample ? 2 : cOffer;
  const offerTotal = isSample ? 2 : (cOffer + cRejectedOffer);
  const rejScreen = isSample ? 3 : cRejectedScreen;
  const rejInterview = isSample ? 1 : cRejectedInterview;
  const rejOffer = isSample ? 0 : cRejectedOffer;
  const rejTotal = isSample ? 4 : totalRejected;

  // Flow Math setup
  const height = 230;
  const width = 910;
  const topPadding = 28;
  const bottomPadding = 35;
  const nodeWidth = 14;

  const scale = (height - topPadding - bottomPadding) / Math.max(1, effectiveTotal);

  // Node heights
  const hApplied = Math.max(effectiveTotal * scale, effectiveTotal > 0 ? 12 : 8);
  const hInterviewing = Math.max(interviewTotal * scale, interviewTotal > 0 ? 12 : 8);
  const hOffers = Math.max(offerTotal * scale, offerTotal > 0 ? 12 : 8);
  const hRejected = Math.max(rejTotal * scale, rejTotal > 0 ? 12 : 8);

  // Node positions with ample margin on both sides to prevent text clipping
  const xApplied = 140;
  const xInterviewing = 385;
  const xOffers = 590;
  const xRejected = 750;

  const yApplied = topPadding;
  const yInterviewing = topPadding + (effectiveTotal - Math.max(1, interviewTotal)) * scale * 0.25;
  const yOffers = topPadding + (effectiveTotal - Math.max(1, offerTotal)) * scale * 0.35;
  const yRejected = topPadding + (effectiveTotal - Math.max(1, rejTotal)) * scale * 0.85;

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
            Visualizing status progression from initial application to interviews, offers, and archive.
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
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="interviewing-to-offers" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="interviewing-to-rejected" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="offers-to-rejected" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.25" />
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

            {/* Link 2: Applied -> Rejected (Screening Stage) */}
            {rejScreen > 0 && (
              <path
                d={getSankeyPath(
                  xApplied + nodeWidth,
                  yApplied + (appliedActive + interviewTotal) * scale + (rejScreen * scale / 2),
                  xRejected,
                  yRejected + (rejScreen * scale / 2)
                )}
                fill="none"
                stroke="url(#applied-to-rejected)"
                strokeWidth={Math.max(2, rejScreen * scale)}
                className="hover:stroke-rose-500/40 transition-colors cursor-pointer"
              >
                <title>{`Rejected at Screening: ${rejScreen}`}</title>
              </path>
            )}

            {/* Link 3: Interviewing -> Offers */}
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

            {/* Link 4: Interviewing -> Rejected (After Interview) */}
            {rejInterview > 0 && (
              <path
                d={getSankeyPath(
                  xInterviewing + nodeWidth,
                  yInterviewing + (interviewActive + offerTotal) * scale + (rejInterview * scale / 2),
                  xRejected,
                  yRejected + (rejScreen * scale) + (rejInterview * scale / 2)
                )}
                fill="none"
                stroke="url(#interviewing-to-rejected)"
                strokeWidth={Math.max(2, rejInterview * scale)}
                className="hover:stroke-rose-500/40 transition-colors cursor-pointer"
              >
                <title>{`Rejected after Interview: ${rejInterview}`}</title>
              </path>
            )}

            {/* Link 5: Offers -> Rejected (Offer Stage) */}
            {rejOffer > 0 && (
              <path
                d={getSankeyPath(
                  xOffers + nodeWidth,
                  yOffers + (offerActive * scale) + (rejOffer * scale / 2),
                  xRejected,
                  yRejected + (rejScreen + rejInterview) * scale + (rejOffer * scale / 2)
                )}
                fill="none"
                stroke="url(#offers-to-rejected)"
                strokeWidth={Math.max(2, rejOffer * scale)}
                className="hover:stroke-rose-500/40 transition-colors cursor-pointer"
              >
                <title>{`Rejected / Declined at Offer: ${rejOffer}`}</title>
              </path>
            )}

            {/* --- NODES (Rectangles & Exact Labels) --- */}
            {/* Node 1: Applied */}
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
                Applied ({appliedActive})
              </text>
              <text x={xApplied - 12} y={yApplied + Math.min(16, hApplied / 2) + 16} className="text-[10px] font-semibold text-slate-500" textAnchor="end">
                {effectiveTotal} total applied
              </text>
            </g>

            {/* Node 2: Interviews */}
            <g>
              <rect
                x={xInterviewing}
                y={yInterviewing}
                width={nodeWidth}
                height={hInterviewing}
                rx={3}
                className={interviewTotal > 0 ? 'fill-indigo-500 shadow-sm' : 'fill-slate-200'}
              />
              <text x={xInterviewing - 12} y={yInterviewing + Math.min(16, hInterviewing / 2) + 2} className={`text-xs font-bold ${interviewActive > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="end">
                Interviewing ({interviewActive})
              </text>
              <text x={xInterviewing - 12} y={yInterviewing + Math.min(16, hInterviewing / 2) + 16} className={`text-[10px] font-semibold ${interviewTotal > 0 ? 'text-indigo-600' : 'text-slate-400'}`} textAnchor="end">
                {interviewTotal > 0 ? `${interviewTotal} reached round` : '0 in pipeline'}
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

            {/* Node 4: Rejected / Archive */}
            <g>
              <rect
                x={xRejected}
                y={yRejected}
                width={nodeWidth}
                height={hRejected}
                rx={3}
                className={rejTotal > 0 ? 'fill-rose-500 shadow-sm' : 'fill-slate-200'}
              />
              <text x={xRejected + nodeWidth + 12} y={yRejected + Math.min(16, hRejected / 2) + 2} className={`text-xs font-bold ${rejTotal > 0 ? 'text-slate-800' : 'text-slate-400'}`} textAnchor="start">
                Archived/Reject ({rejTotal})
              </text>
              <text x={xRejected + nodeWidth + 12} y={yRejected + Math.min(16, hRejected / 2) + 16} className={`text-[10px] font-semibold ${rejTotal > 0 ? 'text-slate-500' : 'text-slate-400'}`} textAnchor="start">
                {rejTotal > 0 ? `${rejScreen} screen • ${rejInterview} interview` : '0 archived'}
              </text>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
