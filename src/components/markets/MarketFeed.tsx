"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "./MarketCard";
import { MarketFilters } from "./MarketFilters";
import type { MarketCategory, MarketSortOption } from "@/types/market";

function MarketCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-5 w-28 rounded bg-secondary" />
        <div className="h-4 w-12 rounded bg-secondary" />
      </div>
      <div className="h-4 w-full rounded bg-secondary mb-1" />
      <div className="h-4 w-2/3 rounded bg-secondary mb-3" />
      <div className="space-y-1.5 mb-3">
        <div className="h-5 rounded bg-secondary" />
        <div className="h-5 rounded bg-secondary" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-16 rounded bg-secondary" />
        <div className="h-3 w-16 rounded bg-secondary" />
      </div>
    </div>
  );
}

interface MarketFeedProps {
  onSelectMarket?: (ticker: string) => void;
}

export function MarketFeed({ onSelectMarket }: MarketFeedProps) {
  const [category, setCategory] = useState<MarketCategory | undefined>();
  const [sort, setSort] = useState<MarketSortOption>("trending");
  const [search, setSearch] = useState("");

  const { data: markets, isLoading, error } = useMarkets({
    category,
    sort,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      <MarketFilters
        category={category}
        sort={sort}
        search={search}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onSearchChange={setSearch}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load markets.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {markets && markets.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No markets found.
        </div>
      )}

      {markets && markets.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {markets.map((market) => (
            <MarketCard
              key={market.ticker}
              market={market}
              onClick={onSelectMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
