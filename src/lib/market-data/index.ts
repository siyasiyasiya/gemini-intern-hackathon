import type { Market, MarketDetail, MarketFilters, MarketSortOption, MarketCategory, MultiContractHistory } from "@/types/market";
import {
  fetchGeminiEvents,
  fetchGeminiEvent,
  geminiEventToMarket,
  geminiEventToMarketDetail,
  fetchContractCandles,
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

  const geminiStatus = filters?.status ?? "active";

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

// Default colors for contracts that don't have one from the API
const DEFAULT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export async function getMarketByTicker(ticker: string): Promise<MarketDetail | null> {
  const event = await fetchGeminiEvent(ticker);
  if (!event) return null;

  const isCategorical = event.contracts.length > 1;

  if (isCategorical) {
    // Pick top 5 contracts with valid prices for multi-line chart
    const contractsWithPrices = event.contracts
      .filter((c) => c.prices?.buy?.yes || c.prices?.lastTradePrice)
      .sort((a, b) => {
        const pa = parseFloat(a.prices.buy?.yes || a.prices.lastTradePrice || "0");
        const pb = parseFloat(b.prices.buy?.yes || b.prices.lastTradePrice || "0");
        return pb - pa;
      })
      .slice(0, 5);

    const [related, ...candleResults] = await Promise.all([
      fetchGeminiEvents({ category: event.category, limit: 4 }),
      ...contractsWithPrices.map((c) =>
        c.instrumentSymbol
          ? fetchContractCandles(c.instrumentSymbol, "1day")
          : Promise.resolve([])
      ),
    ]);

    const contractHistories: MultiContractHistory[] = contractsWithPrices.map((c, i) => ({
      contractLabel: c.label,
      color: c.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      instrumentSymbol: c.instrumentSymbol,
      history: candleResults[i],
    }));

    const primaryHistory = contractHistories[0]?.history || [];

    return geminiEventToMarketDetail(event, related.data, primaryHistory, contractHistories);
  }

  // Binary path
  const featuredContract = getFeaturedContract(event.contracts);
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
