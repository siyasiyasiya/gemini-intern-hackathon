import type {
  GeminiEvent,
  GeminiEventsResponse,
  Market,
  MarketDetail,
  MarketCategory,
  GeminiContract,
} from "@/types/market";

const BASE_URL = "https://api.gemini.com/v1/prediction-markets";

const CATEGORY_MAP: Record<string, MarketCategory> = {
  politics: "politics",
  crypto: "crypto",
  sports: "sports",
  entertainment: "entertainment",
  economics: "economics",
  economy: "economics",
  tech: "technology",
  technology: "technology",
  science: "science",
  commodities: "commodities",
  business: "business",
  weather: "weather",
  media: "media",
  culture: "culture",
  "fun/culture": "culture",
  other: "other",
  live: "other",
};

function mapCategory(raw: string): MarketCategory {
  return CATEGORY_MAP[raw.toLowerCase()] ?? "other";
}

function mapStatus(event: GeminiEvent): "active" | "halted" | "resolved_yes" | "resolved_no" {
  switch (event.status) {
    case "active":
      return "active";
    case "settled": {
      const mainContract = event.contracts[0];
      if (mainContract?.prices?.lastTradePrice) {
        return parseFloat(mainContract.prices.lastTradePrice) >= 0.5
          ? "resolved_yes"
          : "resolved_no";
      }
      return "resolved_yes";
    }
    default:
      return "halted";
  }
}

function extractDescription(desc: unknown): string {
  if (typeof desc === "string") return desc;
  if (desc && typeof desc === "object" && "content" in (desc as Record<string, unknown>)) {
    const content = (desc as { content?: Array<{ content?: Array<{ value?: string }>; value?: string }> }).content;
    if (Array.isArray(content)) {
      return content
        .flatMap((node) =>
          Array.isArray(node.content)
            ? node.content.map((n) => n.value ?? "")
            : node.value ? [node.value] : []
        )
        .join("")
        .slice(0, 300);
    }
  }
  return "";
}

function getFeaturedContract(contracts: GeminiContract[]): GeminiContract | undefined {
  // For binary: usually 1 contract. For categorical: pick the one closest to 50/50 with valid prices.
  const withPrices = contracts.filter(
    (c) => c.prices?.buy?.yes || c.prices?.lastTradePrice
  );
  if (withPrices.length === 0) return contracts[0];
  if (withPrices.length === 1) return withPrices[0];

  // Pick closest to 0.5
  return withPrices.reduce((best, c) => {
    const price = parseFloat(c.prices.lastTradePrice || c.prices.buy?.yes || "0.5");
    const bestPrice = parseFloat(best.prices.lastTradePrice || best.prices.buy?.yes || "0.5");
    return Math.abs(price - 0.5) < Math.abs(bestPrice - 0.5) ? c : best;
  });
}

export function geminiEventToMarket(event: GeminiEvent): Market {
  const contract = getFeaturedContract(event.contracts);
  const yesPrice = contract
    ? parseFloat(contract.prices.buy?.yes || contract.prices.lastTradePrice || "0.5")
    : 0.5;
  const noPrice = Math.round((1 - yesPrice) * 100) / 100;

  // Approximate change from lastTrade vs buy price
  let changePercent = 0;
  if (contract?.prices.lastTradePrice && contract?.prices.buy?.yes) {
    const last = parseFloat(contract.prices.lastTradePrice);
    const buy = parseFloat(contract.prices.buy.yes);
    if (last > 0) {
      changePercent = Math.round(((buy - last) / last) * 1000) / 10;
    }
  }

  const desc =
    typeof event.description === "string"
      ? event.description
      : extractDescription(event.description);

  return {
    ticker: event.ticker,
    title: event.title,
    description: desc,
    category: mapCategory(event.category),
    yesPrice: Math.round(yesPrice * 100) / 100,
    noPrice,
    volume24h: parseInt(event.volume24h || "0", 10),
    totalVolume: parseInt(event.volume || "0", 10),
    resolutionDate: event.expiryDate,
    status: mapStatus(event),
    changePercent24h: changePercent,
    createdAt: event.createdAt,
    imageUrl: event.imageUrl,
    slug: event.slug,
    eventType: event.type,
  };
}

export function geminiEventToMarketDetail(
  event: GeminiEvent,
  relatedEvents: GeminiEvent[]
): MarketDetail {
  const base = geminiEventToMarket(event);
  return {
    ...base,
    resolutionSource: event.source || "Gemini",
    history: [], // Gemini public API doesn't expose price history
    relatedTickers: relatedEvents
      .filter((e) => e.ticker !== event.ticker)
      .slice(0, 3)
      .map((e) => e.ticker),
    contracts: event.contracts,
  };
}

export async function fetchGeminiEvents(params?: {
  category?: string | string[];
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<GeminiEventsResponse> {
  const url = new URL(`${BASE_URL}/events`);
  if (params?.category) {
    const cats = Array.isArray(params.category) ? params.category : [params.category];
    for (const cat of cats) {
      url.searchParams.append("category[]", cat);
    }
  }
  if (params?.search) url.searchParams.append("search", params.search);
  if (params?.status) url.searchParams.append("status[]", params.status);
  url.searchParams.set("limit", String(params?.limit ?? 500));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchGeminiEvent(eventTicker: string): Promise<GeminiEvent | null> {
  const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(eventTicker)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  // The single-event endpoint may return the event directly or wrapped in data
  return data.data ?? data;
}

export async function fetchGeminiCategories(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/categories`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const json = await res.json();
  return json.categories ?? [];
}
