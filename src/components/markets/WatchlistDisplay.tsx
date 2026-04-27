"use client";

import type { Market } from "@/types/market";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

interface WatchlistDisplayProps {
  markets: Market[];
  onSelect?: (ticker: string) => void;
}

export function WatchlistDisplay({ markets, onSelect }: WatchlistDisplayProps) {
  if (markets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <Eye className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">No watched markets yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {markets.map((market) => {
        const isPositive = market.changePercent24h >= 0;
        return (
          <button
            key={market.ticker}
            onClick={() => onSelect?.(market.ticker)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono text-muted-foreground">{market.ticker}</div>
              <div className="text-sm text-foreground truncate">{market.title}</div>
            </div>
            <div className="flex flex-col items-end ml-3">
              <span className="text-sm font-medium text-success">
                {Math.round(market.yesPrice * 100)}%
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {isPositive ? "+" : ""}
                {market.changePercent24h.toFixed(1)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
