"use client";

import type { Market } from "@/types/market";
import { cn, formatCompactNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, BarChart3 } from "lucide-react";

function timeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

interface MarketCardProps {
  market: Market;
  onClick?: (ticker: string) => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const isPositive = market.changePercent24h >= 0;
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <button
      onClick={() => onClick?.(market.ticker)}
      className={cn(
        "w-full text-left rounded-lg border border-border bg-card p-4",
        "transition-all duration-200",
        "hover:border-accent hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-block rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
          {market.ticker}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}
        >
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? "+" : ""}
          {market.changePercent24h.toFixed(1)}%
        </span>
      </div>

      <h3 className="text-sm font-medium text-foreground mb-3 line-clamp-2">
        {market.title}
      </h3>

      {/* YES/NO price bars */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-success w-8">YES</span>
          <div className="flex-1 h-5 rounded bg-secondary overflow-hidden">
            <div
              className="h-full rounded bg-success/80 flex items-center justify-end pr-1.5"
              style={{ width: `${yesPercent}%` }}
            >
              <span className="text-[10px] font-bold text-white">{yesPercent}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-destructive w-8">NO</span>
          <div className="flex-1 h-5 rounded bg-secondary overflow-hidden">
            <div
              className="h-full rounded bg-destructive/80 flex items-center justify-end pr-1.5"
              style={{ width: `${noPercent}%` }}
            >
              <span className="text-[10px] font-bold text-white">{noPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {formatCompactNumber(market.volume24h)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeLeft(market.resolutionDate)}
        </span>
      </div>
    </button>
  );
}
