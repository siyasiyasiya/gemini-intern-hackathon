import type { Market, MarketDetail, MarketFilters, MarketSortOption } from "@/types/market";
import { MOCK_MARKETS, getMarketByTicker, searchMarkets, getMarketsByCategory } from "./mock-data";

function sortMarkets(markets: Market[], sort: MarketSortOption): Market[] {
  const sorted = [...markets];
  switch (sort) {
    case "trending":
      return sorted.sort((a, b) => b.volume24h - a.volume24h);
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "resolving_soon":
      return sorted.sort(
        (a, b) =>
          new Date(a.resolutionDate).getTime() - new Date(b.resolutionDate).getTime()
      );
    case "biggest_movers":
      return sorted.sort(
        (a, b) => Math.abs(b.changePercent24h) - Math.abs(a.changePercent24h)
      );
    case "volume":
      return sorted.sort((a, b) => b.totalVolume - a.totalVolume);
    default:
      return sorted;
  }
}

export function getMarkets(filters?: MarketFilters): Market[] {
  let markets = [...MOCK_MARKETS];

  if (filters?.category) {
    markets = markets.filter((m) => m.category === filters.category);
  }
  if (filters?.status) {
    markets = markets.filter((m) => m.status === filters.status);
  }
  if (filters?.search) {
    const lower = filters.search.toLowerCase();
    markets = markets.filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        m.ticker.toLowerCase().includes(lower)
    );
  }
  if (filters?.sort) {
    markets = sortMarkets(markets, filters.sort);
  } else {
    markets = sortMarkets(markets, "trending");
  }

  return markets;
}

export { getMarketByTicker, searchMarkets, getMarketsByCategory };
