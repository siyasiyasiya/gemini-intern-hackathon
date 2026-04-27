"use client";

import type { Market } from "@/types/market";
import { cn, formatCompactNumber } from "@/lib/utils";
import { BarChart3, Clock } from "lucide-react";

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
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <button
      onClick={() => onClick?.(market.ticker)}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-4",
        "transition-all duration-150",
        "hover:border-border-hover hover:bg-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Header: avatar + category + title */}
      <div className="flex gap-3 mb-3">
        {market.imageUrl ? (
          <img
            src={market.imageUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              {market.ticker.slice(0, 2)}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground capitalize mb-0.5">
            {market.category}
          </p>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
            {market.title}
          </h3>
        </div>
      </div>

      {/* YES / NO buttons — Gemini style */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-yes-bg px-3 py-2.5 text-center transition-colors hover:bg-yes-bg-hover">
          <span className="text-sm font-medium text-yes-text">
            Yes {yesPercent}%
          </span>
        </div>
        <div className="rounded-lg bg-no-bg px-3 py-2.5 text-center transition-colors hover:bg-no-bg-hover">
          <span className="text-sm font-medium text-no-text">
            No {noPercent}%
          </span>
        </div>
      </div>

      {/* Footer: volume + time */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          ${formatCompactNumber(market.volume24h)} vol
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeLeft(market.resolutionDate)}
        </span>
      </div>
    </button>
  );
}
