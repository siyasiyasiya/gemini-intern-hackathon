import type { Market, MarketDetail, MarketFilters, MarketSortOption, MarketCategory } from "@/types/market";
import {
  fetchGeminiEvents,
  fetchGeminiEvent,
  fetchContractCandles,
  geminiEventToMarket,
  geminiEventToMarketDetail,
  getFeaturedContract,
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

export async function getMarkets(filters?: MarketFilters & { categories?: MarketCategory[] }): Promise<Market[]> {
  let geminiCategory: string | string[] | undefined;
  if (filters?.categories && filters.categories.length > 0) {
    geminiCategory = filters.categories
      .map((c) => CATEGORY_TO_GEMINI[c])
      .filter(Boolean) as string[];
  } else if (filters?.category) {
    geminiCategory = CATEGORY_TO_GEMINI[filters.category];
  }

  const geminiStatus = filters?.status === "active" ? "active" : undefined;

  const response = await fetchGeminiEvents({
    category: geminiCategory,
    search: filters?.search,
    status: geminiStatus,
  });

  let markets = response.data.map(geminiEventToMarket);

  // Client-side category filtering (Gemini API can return non-matching results)
  if (filters?.categories && filters.categories.length > 0) {
    markets = markets.filter((m) => filters.categories!.includes(m.category));
  } else if (filters?.category) {
    markets = markets.filter((m) => m.category === filters.category);
  }

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

  const featuredContract = getFeaturedContract(event.contracts);

  // Fetch related events + price history candles in parallel
  const [related, history] = await Promise.all([
    fetchGeminiEvents({ category: event.category, limit: 4 }),
    featuredContract?.instrumentSymbol
      ? fetchContractCandles(featuredContract.instrumentSymbol, "1day")
      : Promise.resolve([]),
  ]);

  return geminiEventToMarketDetail(event, related.data, history);
}

export async function getMarketsByCategory(category: MarketCategory): Promise<Market[]> {
  return getMarkets({ category });
}

export async function getMarketsByTickers(tickers: string[]): Promise<Market[]> {
  if (tickers.length === 0) return [];
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const event = await fetchGeminiEvent(ticker);
        return event ? geminiEventToMarket(event) : null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((m): m is Market => m !== null);
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return getMarkets({ search: query });
}
