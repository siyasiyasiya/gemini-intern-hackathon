"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Market } from "@/types/market";
import type { ApiResponse } from "@/types/api";

interface MarketPillProps {
  ticker: string;
  onClick?: (ticker: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  politics: "🏛️",
  crypto: "₿",
  sports: "⚽",
  entertainment: "🎬",
  science: "🔬",
  economics: "📈",
  technology: "💻",
  other: "📊",
};

export function MarketPill({ ticker, onClick }: MarketPillProps) {
  const { data: market } = useQuery({
    queryKey: ["market-pill", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${encodeURIComponent(ticker)}`);
      const json: ApiResponse<Market> = await res.json();
      return json.data ?? null;
    },
    staleTime: 60000,
  });

  if (!market) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        📊 {ticker}
      </span>
    );
  }

  const isResolved = market.status === "resolved_yes" || market.status === "resolved_no";
  const icon = CATEGORY_ICONS[market.category] || "📊";

  const pillClassName = cn(
    "group/pill relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
    isResolved
      ? "border-muted bg-muted/50 text-muted-foreground"
      : "border-accent/20 bg-accent/10 text-foreground hover:bg-accent/20"
  );

  const pillContent = (
    <>
      <span>{icon}</span>
      <span className="max-w-[180px] truncate">{market.title}</span>
      {isResolved ? (
        <span
          className={cn(
            "ml-0.5 rounded px-1 py-px text-[10px] font-semibold",
            market.status === "resolved_yes"
              ? "bg-yes-bg text-yes-text"
              : "bg-no-bg text-no-text"
          )}
        >
          {market.status === "resolved_yes" ? "YES" : "NO"}
        </span>
      ) : (
        <span className="text-yes-text">{Math.round(market.yesPrice * 100)}¢</span>
      )}

      {/* Hover tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg opacity-0 group-hover/pill:opacity-100 transition-opacity">
        <span className="block font-medium text-foreground">{market.title}</span>
        <span className="mt-1 flex items-center gap-2 text-muted-foreground">
          <span className="text-yes-text">Yes {Math.round(market.yesPrice * 100)}¢</span>
          <span className="text-no-text">No {Math.round(market.noPrice * 100)}¢</span>
          <span>Vol: {market.volume24h.toLocaleString()}</span>
        </span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(ticker)} className={pillClassName}>
        {pillContent}
      </button>
    );
  }

  return (
    <Link href={`/markets/${encodeURIComponent(ticker)}`} className={pillClassName}>
      {pillContent}
    </Link>
  );
}
