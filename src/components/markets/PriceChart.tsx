"use client";

import { useState, useMemo } from "react";
import type { PricePoint } from "@/types/market";

interface PriceChartProps {
  history: PricePoint[];
}

const CHART_W = 600;
const CHART_H = 200;
const PAD = { top: 10, right: 10, bottom: 20, left: 40 };

export function PriceChart({ history }: PriceChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { path, points, yLabels } = useMemo(() => {
    if (history.length === 0) return { path: "", points: [], yLabels: [] };

    const w = CHART_W - PAD.left - PAD.right;
    const h = CHART_H - PAD.top - PAD.bottom;

    const pts = history.map((p, i) => ({
      x: PAD.left + (i / (history.length - 1)) * w,
      y: PAD.top + (1 - p.yesPrice) * h,
      data: p,
    }));

    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    const labels = [0, 0.25, 0.5, 0.75, 1].map((v) => ({
      label: `${Math.round(v * 100)}%`,
      y: PAD.top + (1 - v) * h,
    }));

    return { path: d, points: pts, yLabels: labels };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground">
        No price history available
      </div>
    );
  }

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid lines */}
        {yLabels.map((yl) => (
          <g key={yl.label}>
            <line
              x1={PAD.left}
              x2={CHART_W - PAD.right}
              y1={yl.y}
              y2={yl.y}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
            <text
              x={PAD.left - 6}
              y={yl.y + 3}
              textAnchor="end"
              fill="var(--muted-foreground)"
              fontSize={10}
            >
              {yl.label}
            </text>
          </g>
        ))}

        {/* Line */}
        <path d={path} fill="none" stroke="#22c55e" strokeWidth={2} />

        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        {points.length > 0 && (
          <path
            d={`${path} L ${points[points.length - 1].x} ${CHART_H - PAD.bottom} L ${points[0].x} ${CHART_H - PAD.bottom} Z`}
            fill="url(#chartGrad)"
          />
        )}

        {/* Hover targets */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - (CHART_W / points.length) / 2}
            y={PAD.top}
            width={CHART_W / points.length}
            height={CHART_H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
        ))}

        {/* Hover dot */}
        {hovered && (
          <circle cx={hovered.x} cy={hovered.y} r={4} fill="#22c55e" stroke="var(--card)" strokeWidth={2} />
        )}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute top-0 pointer-events-none rounded border border-border bg-card px-2 py-1 text-xs shadow-lg"
          style={{
            left: `${(hovered.x / CHART_W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium text-success">{Math.round(hovered.data.yesPrice * 100)}% YES</div>
          <div className="text-muted-foreground">
            {new Date(hovered.data.timestamp).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
