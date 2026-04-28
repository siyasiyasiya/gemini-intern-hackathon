"use client";

import { useState, useMemo } from "react";
import { useAutopsy } from "@/hooks/useAutopsy";
import { AutopsyEventCard } from "./AutopsyEventCard";
import { AutopsyCommentCluster } from "./AutopsyCommentDot";
import { Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutopsyComment, InflectionPointWithContext } from "@/lib/autopsy/types";
import type { PricePoint } from "@/types/market";

const CHART_W = 800;
const CHART_H = 240;
const PAD = { top: 10, right: 10, bottom: 24, left: 44 };

function buildPath(data: PricePoint[], w: number, h: number) {
  if (data.length === 0) return { path: "", points: [] as { x: number; y: number; data: PricePoint }[] };
  const pts = data.map((p, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * w,
    y: PAD.top + (1 - p.yesPrice) * h,
    data: p,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return { path: d, points: pts };
}

function timestampToX(ts: string, candles: PricePoint[], w: number): number {
  if (candles.length === 0) return PAD.left;
  const t = new Date(ts).getTime();
  const first = new Date(candles[0].timestamp).getTime();
  const last = new Date(candles[candles.length - 1].timestamp).getTime();
  const range = last - first || 1;
  return PAD.left + ((t - first) / range) * w;
}

function priceToY(price: number, h: number): number {
  return PAD.top + (1 - price) * h;
}

// Cluster comments that are within 3% of chart width of each other
function clusterComments(
  comments: AutopsyComment[],
  candles: PricePoint[],
  w: number,
  h: number
): { x: number; y: number; comments: AutopsyComment[] }[] {
  if (comments.length === 0 || candles.length === 0) return [];
  const threshold = w * 0.03;
  const positioned = comments.map((c) => ({
    comment: c,
    x: timestampToX(c.timestamp, candles, w),
  }));

  positioned.sort((a, b) => a.x - b.x);

  const clusters: { x: number; comments: AutopsyComment[] }[] = [];
  for (const p of positioned) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(p.x - last.x) < threshold) {
      last.comments.push(p.comment);
      last.x = (last.x + p.x) / 2;
    } else {
      clusters.push({ x: p.x, comments: [p.comment] });
    }
  }

  // Find closest candle price for y position
  return clusters.map((cl) => {
    const idx = Math.round(((cl.x - PAD.left) / w) * (candles.length - 1));
    const safeIdx = Math.max(0, Math.min(candles.length - 1, idx));
    return { ...cl, y: priceToY(candles[safeIdx].yesPrice, h) };
  });
}

interface AutopsyTimelineProps {
  ticker: string;
}

export function AutopsyTimeline({ ticker }: AutopsyTimelineProps) {
  const { data, isLoading, isStreaming, streamProgress } = useAutopsy(ticker);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [highlightedInflection, setHighlightedInflection] = useState<string | null>(null);

  const w = CHART_W - PAD.left - PAD.right;
  const h = CHART_H - PAD.top - PAD.bottom;

  const candles = data?.priceHistory ?? [];

  const { path, points } = useMemo(() => buildPath(candles, w, h), [candles, w, h]);

  const yLabels = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((v) => ({ label: `${Math.round(v * 100)}%`, y: PAD.top + (1 - v) * h })),
    [h]
  );

  const commentClusters = useMemo(
    () => clusterComments(data?.comments ?? [], candles, w, h),
    [data?.comments, candles, w, h]
  );

  const hoveredPoint = hoverIdx !== null ? points[hoverIdx] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-secondary/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground">
        No price history available for autopsy
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stream progress */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing events... {streamProgress}%
        </div>
      )}

      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: CHART_W }}>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto"
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* Grid */}
            {yLabels.map((yl) => (
              <g key={yl.label}>
                <line x1={PAD.left} x2={CHART_W - PAD.right} y1={yl.y} y2={yl.y} stroke="var(--border)" strokeWidth={0.5} />
                <text x={PAD.left - 6} y={yl.y + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize={10}>
                  {yl.label}
                </text>
              </g>
            ))}

            {/* Inflection window shading */}
            {data.inflectionPoints.map((ip) => {
              const x1 = timestampToX(ip.windowStart, candles, w);
              const x2 = timestampToX(ip.windowEnd, candles, w);
              const width = Math.max(x2 - x1, 8);
              const isHighlighted = highlightedInflection === ip.id;
              return (
                <rect
                  key={ip.id}
                  x={x1 - 2}
                  y={PAD.top}
                  width={width + 4}
                  height={h}
                  fill={ip.direction === "up" ? "#22c55e" : "#ef4444"}
                  opacity={isHighlighted ? 0.15 : 0.06}
                  rx={3}
                />
              );
            })}

            {/* Price line + gradient */}
            <defs>
              <linearGradient id="autopsyGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={path} fill="none" stroke="#22c55e" strokeWidth={2} />
            {points.length > 0 && (
              <path
                d={`${path} L ${points[points.length - 1].x} ${CHART_H - PAD.bottom} L ${points[0].x} ${CHART_H - PAD.bottom} Z`}
                fill="url(#autopsyGrad)"
              />
            )}

            {/* Inflection diamond markers */}
            {data.inflectionPoints.map((ip) => {
              const x = timestampToX(ip.timestamp, candles, w);
              const y = priceToY(ip.priceAtPoint, h);
              const size = 5;
              return (
                <polygon
                  key={`diamond-${ip.id}`}
                  points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
                  fill={ip.direction === "up" ? "#22c55e" : "#ef4444"}
                  stroke="var(--card)"
                  strokeWidth={1.5}
                  onMouseEnter={() => setHighlightedInflection(ip.id)}
                  onMouseLeave={() => setHighlightedInflection(null)}
                  className="cursor-pointer"
                />
              );
            })}

            {/* Comment dots */}
            {commentClusters.map((cl, i) => (
              <AutopsyCommentCluster
                key={i}
                comments={cl.comments}
                x={cl.x}
                y={cl.y - 12}
                chartWidth={CHART_W}
              />
            ))}

            {/* Hover hit areas */}
            {points.map((_, i) => {
              const xStep = w / Math.max(points.length - 1, 1);
              const x = PAD.left + i * xStep;
              return (
                <rect
                  key={`hover-${i}`}
                  x={x - (CHART_W / points.length) / 2}
                  y={PAD.top}
                  width={CHART_W / points.length}
                  height={h}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              );
            })}

            {/* Hover indicator */}
            {hoveredPoint && (
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={4} fill="#22c55e" stroke="var(--card)" strokeWidth={2} />
            )}
          </svg>

          {/* Hover tooltip */}
          {hoveredPoint && (
            <div
              className="relative pointer-events-none"
              style={{ marginTop: -CHART_H }}
            >
              <div
                className="absolute top-1 rounded border border-border bg-card px-2 py-1 text-xs shadow-lg z-10"
                style={{
                  left: `${(hoveredPoint.x / CHART_W) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="font-medium text-yes-text">{Math.round(hoveredPoint.data.yesPrice * 100)}% YES</div>
                <div className="text-muted-foreground">{new Date(hoveredPoint.data.timestamp).toLocaleDateString()}</div>
                {hoveredPoint.data.volume > 0 && (
                  <div className="text-muted-foreground">Vol: {hoveredPoint.data.volume.toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event cards below chart */}
      {data.inflectionPoints.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Key Events ({data.inflectionPoints.length})
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {data.inflectionPoints.map((ip) => (
              <div
                key={ip.id}
                onMouseEnter={() => setHighlightedInflection(ip.id)}
                onMouseLeave={() => setHighlightedInflection(null)}
              >
                <AutopsyEventCard
                  event={ip.externalEvent}
                  isStreaming={isStreaming && !ip.externalEvent}
                  relatedComments={ip.relatedComments}
                  direction={ip.direction}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-3">
          No significant inflection points detected
        </div>
      )}
    </div>
  );
}
