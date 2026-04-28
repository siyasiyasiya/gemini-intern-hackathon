"use client";

import { useState, useMemo } from "react";
import type { PricePoint, MultiContractHistory } from "@/types/market";

interface PriceChartProps {
  history: PricePoint[];
  contractHistories?: MultiContractHistory[];
}

const CHART_W = 600;
const CHART_H = 200;
const PAD = { top: 10, right: 10, bottom: 20, left: 40 };

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

export function PriceChart({ history, contractHistories }: PriceChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const isMulti = contractHistories && contractHistories.length > 1;

  const w = CHART_W - PAD.left - PAD.right;
  const h = CHART_H - PAD.top - PAD.bottom;

  const yLabels = useMemo(
    () =>
      [0, 0.25, 0.5, 0.75, 1].map((v) => ({
        label: `${Math.round(v * 100)}%`,
        y: PAD.top + (1 - v) * h,
      })),
    [h]
  );

  const multiData = useMemo(() => {
    if (!isMulti) return null;
    return contractHistories.map((ch) => ({
      ...ch,
      ...buildPath(ch.history, w, h),
    }));
  }, [contractHistories, isMulti, w, h]);

  const singleData = useMemo(() => {
    if (isMulti) return null;
    return buildPath(history, w, h);
  }, [history, isMulti, w, h]);

  const maxLen = isMulti
    ? Math.max(...(multiData?.map((d) => d.history.length) || [0]))
    : history.length;

  if (maxLen === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground">
        No price history available
      </div>
    );
  }

  const hoveredMulti =
    isMulti && hoverIdx !== null && multiData
      ? multiData.map((d) => {
          const pt = d.points[hoverIdx];
          return pt
            ? { label: d.contractLabel, color: d.color, price: pt.data.yesPrice, timestamp: pt.data.timestamp }
            : null;
        }).filter(Boolean) as { label: string; color: string; price: number; timestamp: string }[]
      : null;

  const hoveredSingle = !isMulti && hoverIdx !== null && singleData ? singleData.points[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
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

        {isMulti && multiData ? (
          multiData.map((d) => (
            <path key={d.instrumentSymbol} d={d.path} fill="none" stroke={d.color} strokeWidth={2} />
          ))
        ) : singleData ? (
          <>
            <path d={singleData.path} fill="none" stroke="#22c55e" strokeWidth={2} />
            <defs>
              <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            {singleData.points.length > 0 && (
              <path
                d={`${singleData.path} L ${singleData.points[singleData.points.length - 1].x} ${CHART_H - PAD.bottom} L ${singleData.points[0].x} ${CHART_H - PAD.bottom} Z`}
                fill="url(#chartGrad)"
              />
            )}
          </>
        ) : null}

        {Array.from({ length: maxLen }, (_, i) => {
          const xStep = w / Math.max(maxLen - 1, 1);
          const x = PAD.left + i * xStep;
          return (
            <rect
              key={i}
              x={x - (CHART_W / maxLen) / 2}
              y={PAD.top}
              width={CHART_W / maxLen}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          );
        })}

        {isMulti && hoverIdx !== null && multiData
          ? multiData.map((d) => {
              const pt = d.points[hoverIdx];
              return pt ? (
                <circle key={d.instrumentSymbol} cx={pt.x} cy={pt.y} r={4} fill={d.color} stroke="var(--card)" strokeWidth={2} />
              ) : null;
            })
          : hoveredSingle && (
              <circle cx={hoveredSingle.x} cy={hoveredSingle.y} r={4} fill="#22c55e" stroke="var(--card)" strokeWidth={2} />
            )}
      </svg>

      {hoveredMulti && hoveredMulti.length > 0 && (
        <div
          className="absolute top-0 pointer-events-none rounded border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg z-10"
          style={{
            left: `${((PAD.left + hoverIdx! * (w / Math.max(maxLen - 1, 1))) / CHART_W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {hoveredMulti.map((h) => (
            <div key={h.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
              <span className="text-foreground">{h.label}</span>
              <span className="font-medium" style={{ color: h.color }}>{Math.round(h.price * 100)}%</span>
            </div>
          ))}
          <div className="text-muted-foreground mt-0.5">
            {new Date(hoveredMulti[0].timestamp).toLocaleDateString()}
          </div>
        </div>
      )}

      {hoveredSingle && (
        <div
          className="absolute top-0 pointer-events-none rounded border border-border bg-card px-2 py-1 text-xs shadow-lg"
          style={{
            left: `${(hoveredSingle.x / CHART_W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium text-success">{Math.round(hoveredSingle.data.yesPrice * 100)}% YES</div>
          <div className="text-muted-foreground">
            {new Date(hoveredSingle.data.timestamp).toLocaleDateString()}
          </div>
        </div>
      )}

      {isMulti && multiData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
          {multiData.map((d) => (
            <div key={d.instrumentSymbol} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.contractLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
