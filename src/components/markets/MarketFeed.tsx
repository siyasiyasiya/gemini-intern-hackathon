"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useConstellationMarkets } from "@/hooks/useConstellationMarkets";
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
  constellationSlug?: string;
}

export function MarketFeed({ onSelectMarket, constellationSlug }: MarketFeedProps) {
  const [category, setCategory] = useState<MarketCategory | undefined>();
  const [sort, setSort] = useState<MarketSortOption>("trending");
  const [search, setSearch] = useState("");

  const globalQuery = useMarkets(
    constellationSlug ? undefined : { category, sort, search: search || undefined }
  );
  const constellationQuery = useConstellationMarkets(
    constellationSlug || "",
    constellationSlug ? { sort, search: search || undefined } : undefined
  );

  const activeQuery = constellationSlug ? constellationQuery : globalQuery;
  const markets = constellationSlug
    ? (constellationQuery.data?.data || [])
    : (globalQuery.data || []);
  const trackedTickers = new Set(constellationQuery.data?.watchlistTickers || []);
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;

  return (
    <div className="space-y-4">
      {constellationSlug ? (
        <MarketFilters
          sort={sort}
          search={search}
          onCategoryChange={() => {}}
          onSortChange={setSort}
          onSearchChange={setSearch}
          hideCategories
        />
      ) : (
        <MarketFilters
          category={category}
          sort={sort}
          search={search}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onSearchChange={setSearch}
        />
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load markets.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3 grid-cols-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {markets && markets.length === 0 && !isLoading && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No markets found.
        </div>
      )}

      {markets && markets.length > 0 && (
        <div className="grid gap-3 grid-cols-1">
          {markets.map((market) => (
            <MarketCard
              key={market.ticker}
              market={market}
              onClick={onSelectMarket}
              pinned={trackedTickers.has(market.ticker)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
