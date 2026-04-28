"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AutopsyComment } from "@/lib/autopsy/types";

interface AutopsyCommentDotProps {
  comment: AutopsyComment;
  x: number;
  y: number;
  chartWidth: number;
}

export function AutopsyCommentDot({ comment, x, y, chartWidth }: AutopsyCommentDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const fillColor =
    comment.positionDirection === "yes"
      ? "#22c55e"
      : comment.positionDirection === "no"
        ? "#ef4444"
        : "#6b7280";

  // Keep tooltip within chart bounds
  const tooltipLeft = x < chartWidth / 2;

  return (
    <g
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="cursor-pointer"
    >
      <circle cx={x} cy={y} r={5} fill={fillColor} stroke="var(--card)" strokeWidth={2} opacity={0.9} />

      {showTooltip && (
        <foreignObject
          x={tooltipLeft ? x + 8 : x - 208}
          y={y - 50}
          width={200}
          height={100}
          className="pointer-events-none overflow-visible"
        >
          <div className="rounded-lg border border-border bg-card p-2 shadow-lg text-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-medium text-foreground">@{comment.username}</span>
              {comment.positionDirection && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  comment.positionDirection === "yes" ? "bg-yes-bg text-yes-text" : "bg-no-bg text-no-text"
                )}>
                  {comment.positionDirection.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-muted-foreground line-clamp-2 leading-relaxed">
              {comment.content.replace(/\{\{market:[^}]+\}\}/g, "").trim()}
            </p>
            <div className="mt-1 text-[10px] text-accent">{comment.constellationName}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

interface CommentClusterProps {
  comments: AutopsyComment[];
  x: number;
  y: number;
  chartWidth: number;
}

export function AutopsyCommentCluster({ comments, x, y, chartWidth }: CommentClusterProps) {
  const [expanded, setExpanded] = useState(false);

  if (comments.length === 1) {
    return <AutopsyCommentDot comment={comments[0]} x={x} y={y} chartWidth={chartWidth} />;
  }

  const dominantDirection = (() => {
    const yes = comments.filter((c) => c.positionDirection === "yes").length;
    const no = comments.filter((c) => c.positionDirection === "no").length;
    if (yes > no) return "yes";
    if (no > yes) return "no";
    return null;
  })();

  const fillColor = dominantDirection === "yes" ? "#22c55e" : dominantDirection === "no" ? "#ef4444" : "#6b7280";
  const tooltipLeft = x < chartWidth / 2;

  return (
    <g
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="cursor-pointer"
    >
      <circle cx={x} cy={y} r={8} fill={fillColor} stroke="var(--card)" strokeWidth={2} opacity={0.9} />
      <text x={x} y={y + 3.5} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
        {comments.length}
      </text>

      {expanded && (
        <foreignObject
          x={tooltipLeft ? x + 12 : x - 220}
          y={y - 60}
          width={210}
          height={Math.min(comments.length * 50 + 20, 180)}
          className="pointer-events-none overflow-visible"
        >
          <div className="rounded-lg border border-border bg-card p-2 shadow-lg text-xs space-y-1.5 max-h-[160px] overflow-y-auto">
            {comments.slice(0, 4).map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">@{c.username}</span>
                  {c.positionDirection && (
                    <span className={cn(
                      "rounded-full px-1 py-0.5 text-[9px] font-medium",
                      c.positionDirection === "yes" ? "bg-yes-bg text-yes-text" : "bg-no-bg text-no-text"
                    )}>
                      {c.positionDirection.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-1">{c.content.replace(/\{\{market:[^}]+\}\}/g, "").trim()}</p>
              </div>
            ))}
            {comments.length > 4 && (
              <div className="text-[10px] text-muted-foreground">+{comments.length - 4} more</div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
