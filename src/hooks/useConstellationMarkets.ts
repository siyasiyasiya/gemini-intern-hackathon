"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market, MarketSortOption } from "@/types/market";

interface ConstellationMarketsResponse {
  data: Market[];
  watchlistTickers: string[];
}

export function useConstellationMarkets(slug: string, filters?: { sort?: MarketSortOption; search?: string }) {
  return useQuery({
    queryKey: ["constellation-markets", slug, filters],
    queryFn: async (): Promise<ConstellationMarketsResponse> => {
      const res = await fetch(`/api/constellations/${slug}/markets`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      let markets: Market[] = json.data || [];

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        markets = markets.filter(
          (m) => m.title.toLowerCase().includes(q) || m.ticker.toLowerCase().includes(q)
        );
      }

      if (filters?.sort) {
        markets = sortMarkets(markets, filters.sort);
      }

      return { data: markets, watchlistTickers: json.watchlistTickers || [] };
    },
    enabled: !!slug,
  });
}

function sortMarkets(markets: Market[], sort: MarketSortOption): Market[] {
  const sorted = [...markets];
  switch (sort) {
    case "trending":
      return sorted.sort((a, b) => b.volume24h - a.volume24h);
    case "newest":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "resolving_soon":
      return sorted.sort((a, b) => new Date(a.resolutionDate).getTime() - new Date(b.resolutionDate).getTime());
    case "biggest_movers":
      return sorted.sort((a, b) => Math.abs(b.changePercent24h) - Math.abs(a.changePercent24h));
    case "volume":
      return sorted.sort((a, b) => b.totalVolume - a.totalVolume);
    default:
      return sorted;
  }
}
