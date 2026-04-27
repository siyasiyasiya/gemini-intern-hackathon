import type { Market, MarketDetail, MarketFilters, MarketSortOption, MarketCategory } from "@/types/market";
import {
  fetchGeminiEvents,
  fetchGeminiEvent,
  geminiEventToMarket,
  geminiEventToMarketDetail,
} from "./gemini-api";

// Map our lowercase categories to Gemini's mixed-case values for the API query
const CATEGORY_TO_GEMINI: Partial<Record<MarketCategory, string>> = {
  politics: "Politics",
  crypto: "Crypto",
  sports: "Sports",
  entertainment: "Entertainment",
  economics: "Economics",
  technology: "Tech",
  science: "Science",
  commodities: "Commodities",
  business: "Business",
  weather: "Weather",
  media: "Media",
  culture: "Culture",
};

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

export async function getMarkets(filters?: MarketFilters): Promise<Market[]> {
  const geminiCategory = filters?.category
    ? CATEGORY_TO_GEMINI[filters.category]
    : undefined;

  const geminiStatus = filters?.status === "active" ? "active" : undefined;

  const response = await fetchGeminiEvents({
    category: geminiCategory,
    search: filters?.search,
    status: geminiStatus,
    limit: 50,
  });

  let markets = response.data.map(geminiEventToMarket);

  // Client-side filtering for statuses Gemini doesn't directly map
  if (filters?.status && filters.status !== "active") {
    markets = markets.filter((m) => m.status === filters.status);
  }

  const sort = filters?.sort ?? "trending";
  return sortMarkets(markets, sort);
}

export async function getMarketByTicker(ticker: string): Promise<MarketDetail | null> {
  const event = await fetchGeminiEvent(ticker);
  if (!event) return null;

  // Fetch related events in the same category
  const related = await fetchGeminiEvents({
    category: event.category,
    limit: 4,
  });

  return geminiEventToMarketDetail(event, related.data);
}

export async function getMarketsByCategory(category: MarketCategory): Promise<Market[]> {
  return getMarkets({ category });
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return getMarkets({ search: query });
}
