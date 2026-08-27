'use client';

import React from 'react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'DRAFT' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';
  updatedAt: string;
}

interface SankeyChartProps {
  apps: Application[];
}

export default function SankeyChart({ apps }: SankeyChartProps) {
  // Filter out DRAFT state to focus on active steps: Applied, Interviewing, Offers, Archived/Reject
  const activeApps = apps.filter((a) => a.status !== 'DRAFT');

  // Compute counts
  const cApplied = activeApps.filter((a) => a.status === 'APPLIED').length;
  const cInterviewing = activeApps.filter((a) => a.status === 'INTERVIEWING').length;
  const cOffer = activeApps.filter((a) => a.status === 'OFFER').length;
  const cRejected = activeApps.filter((a) => a.status === 'REJECTED').length;

  const realTotal = activeApps.length;
  const isSampleData = realTotal === 0;

  // Use sample dataset if tracker is empty so user can see what it looks like
  const total = isSampleData ? 12 : realTotal;
  const appliedCount = isSampleData ? 4 : cApplied;
  const interviewingCount = isSampleData ? 3 : cInterviewing;
  const offerCount = isSampleData ? 2 : cOffer;
  const rejectedCount = isSampleData ? 3 : cRejected;

  // Split rejects: 60% direct from applied, 40% after interview
  const cRejectedApplied = Math.ceil(rejectedCount * 0.6);
  const cRejectedInterview = rejectedCount - cRejectedApplied;

  // Flow Math setup
  const height = 220;
  const width = 760;
  const topPadding = 25;
  const bottomPadding = 35;
  const scale = (height - topPadding - bottomPadding) / Math.max(1, total);

  // Node heights
  const hApplied = total * scale;
  const hInterviewing = (interviewingCount + offerCount + cRejectedInterview) * scale;
  const hOffers = offerCount * scale;
  const hRejected = rejectedCount * scale;

  // Node positions
  const yApplied = topPadding;
  const yInterviewing = topPadding + (total - (interviewingCount + offerCount + cRejectedInterview)) * scale * 0.5;
  const yOffers = topPadding + (total - offerCount) * scale * 0.5;
  const yRejected = height - bottomPadding - hRejected;

  const xApplied = 50;
  const xInterviewing = 250;
  const xOffers = 450;
  const xRejected = 650;
  const nodeWidth = 14;

  // Helper to generate SVG cubic Bezier path between two points
  const getSankeyPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cpX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cpX} ${y1}, ${cpX} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Application Funnel (Sankey Flow)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visualizing status progression from initial application to interviews, offers, and archive.
          </p>
        </div>
        {isSampleData && (
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-250 font-bold uppercase tracking-wider">
            Sample Data
          </span>
        )}
      </div>

      <div className="relative overflow-x-auto select-none pt-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[700px] h-fit">
          <defs>
            {/* Gradients for links */}
            <linearGradient id="applied-to-interviewing" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="applied-to-rejected" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="interviewing-to-offers" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="interviewing-to-rejected" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* --- LINKS / PATHS --- */}
          {/* Link 1: Applied -> Interviewing */}
          {hInterviewing > 0 && (
            <path
              d={getSankeyPath(
                xApplied + nodeWidth,
                yApplied + (appliedCount * scale) + (hInterviewing / 2),
                xInterviewing,
                yInterviewing + (hInterviewing / 2)
              )}
              fill="none"
              stroke="url(#applied-to-interviewing)"
              strokeWidth={hInterviewing}
              className="hover:stroke-indigo-500/40 transition-colors cursor-pointer"
            />
          )}

          {/* Link 2: Applied -> Rejected (Direct) */}
          {cRejectedApplied > 0 && (
            <path
              d={getSankeyPath(
                xApplied + nodeWidth,
                yApplied + (appliedCount + interviewingCount + offerCount + cRejectedInterview) * scale + (cRejectedApplied * scale / 2),
                xRejected,
                yRejected + (cRejectedApplied * scale / 2)
              )}
              fill="none"
              stroke="url(#applied-to-rejected)"
              strokeWidth={cRejectedApplied * scale}
              className="hover:stroke-rose-500/30 transition-colors cursor-pointer"
            />
          )}

          {/* Link 3: Interviewing -> Offers */}
          {hOffers > 0 && (
            <path
              d={getSankeyPath(
                xInterviewing + nodeWidth,
                yInterviewing + (interviewingCount * scale) + (hOffers / 2),
                xOffers,
                yOffers + (hOffers / 2)
              )}
              fill="none"
              stroke="url(#interviewing-to-offers)"
              strokeWidth={hOffers}
              className="hover:stroke-emerald-500/50 transition-colors cursor-pointer"
            />
          )}

          {/* Link 4: Interviewing -> Rejected (After Interview) */}
          {cRejectedInterview > 0 && (
            <path
              d={getSankeyPath(
                xInterviewing + nodeWidth,
                yInterviewing + (interviewingCount + offerCount) * scale + (cRejectedInterview * scale / 2),
                xRejected,
                yRejected + (cRejectedApplied * scale) + (cRejectedInterview * scale / 2)
              )}
              fill="none"
              stroke="url(#interviewing-to-rejected)"
              strokeWidth={cRejectedInterview * scale}
              className="hover:stroke-rose-500/30 transition-colors cursor-pointer"
            />
          )}


          {/* --- NODES (Rects) --- */}
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
            <text x={xApplied - 8} y={yApplied + (hApplied / 2) + 4} className="text-xs font-bold text-slate-700 text-end" textAnchor="end">
              Applied ({isSampleData ? 12 : realTotal})
            </text>
          </g>

          {/* Node 2: Interviewing */}
          <g>
            <rect
              x={xInterviewing}
              y={yInterviewing}
              width={nodeWidth}
              height={hInterviewing}
              rx={3}
              className="fill-indigo-500 shadow-sm"
            />
            <text x={xInterviewing + nodeWidth + 8} y={yInterviewing - 6} className="text-[10px] font-bold text-slate-500">
              INTERVIEWS
            </text>
            <text x={xInterviewing - 8} y={yInterviewing + (hInterviewing / 2) + 4} className="text-xs font-bold text-slate-700 text-end" textAnchor="end">
              Interviewing ({isSampleData ? 5 : (cInterviewing + cOffer + cRejectedInterview)})
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
              className="fill-emerald-500 shadow-sm"
            />
            <text x={xOffers + nodeWidth + 8} y={yOffers + (hOffers / 2) + 4} className="text-xs font-bold text-slate-700" textAnchor="start">
              Offers ({isSampleData ? 2 : cOffer})
            </text>
          </g>

          {/* Node 4: Rejected */}
          <g>
            <rect
              x={xRejected}
              y={yRejected}
              width={nodeWidth}
              height={hRejected}
              rx={3}
              className="fill-rose-500 shadow-sm"
            />
            <text x={xRejected + nodeWidth + 8} y={yRejected + (hRejected / 2) + 4} className="text-xs font-bold text-slate-700" textAnchor="start">
              Archived/Reject ({isSampleData ? 3 : cRejected})
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
