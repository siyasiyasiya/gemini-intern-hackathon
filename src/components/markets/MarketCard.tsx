"use client";

import Link from "next/link";
import type { Market } from "@/types/market";
import { cn, formatCompactNumber } from "@/lib/utils";
import { BarChart3, Clock, Pin } from "lucide-react";

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
  pinned?: boolean;
}

export function MarketCard({ market, onClick, pinned }: MarketCardProps) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const isCategorical = market.outcomes && market.outcomes.length > 1;

  const cardClassName = cn(
    "w-full text-left rounded-xl border border-border bg-card p-4",
    "transition-all duration-150",
    "hover:border-border-hover hover:bg-card-hover",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

  const cardContent = (
    <>
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
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs text-muted-foreground capitalize">
              {market.category}
            </p>
            {pinned && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-accent">
                <Pin className="h-2.5 w-2.5" />
                Tracked
              </span>
            )}
          </div>
          <h3
            className="text-sm font-semibold text-foreground leading-tight line-clamp-2"
            style={{ overflowWrap: "break-word", wordBreak: "normal" }}
          >
            {market.title}
          </h3>
        </div>
      </div>

      {isCategorical ? (
        <div className="space-y-1.5 mb-3">
          {market.outcomes!.slice(0, 3).map((o) => (
            <div key={o.ticker} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: o.color || "#6b7280" }}
              />
              <span className="text-foreground truncate flex-1">{o.label}</span>
              <span className="font-medium text-foreground">{Math.round(o.yesPrice * 100)}%</span>
            </div>
          ))}
          {market.outcomes!.length > 3 && (
            <div className="text-xs text-muted-foreground pl-4">
              +{market.outcomes!.length - 3} more
            </div>
          )}
        </div>
      ) : (
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
      )}

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
    </>
  );

  if (onClick) {
    return (
      <button onClick={() => onClick(market.ticker)} className={cardClassName}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={`/markets/${encodeURIComponent(market.ticker)}`} className={cn(cardClassName, "block")}>
      {cardContent}
    </Link>
  );
}
