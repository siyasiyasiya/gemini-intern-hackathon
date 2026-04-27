export interface Market {
  ticker: string;
  title: string;
  description: string;
  category: MarketCategory;
  yesPrice: number; // 0-1 representing odds
  noPrice: number;  // 0-1, always 1 - yesPrice
  volume24h: number;
  totalVolume: number;
  resolutionDate: string; // ISO date
  status: MarketStatus;
  changePercent24h: number; // positive = YES odds up, negative = down
  createdAt: string;
  imageUrl?: string;
  slug?: string;
  eventType?: "binary" | "categorical";
}

export interface MarketDetail extends Market {
  resolutionSource: string;
  history: PricePoint[];
  relatedTickers: string[];
  contracts?: GeminiContract[];
}

export interface PricePoint {
  timestamp: string;
  yesPrice: number;
  volume: number;
}

export type MarketCategory =
  | "politics"
  | "crypto"
  | "sports"
  | "entertainment"
  | "science"
  | "economics"
  | "technology"
  | "commodities"
  | "business"
  | "weather"
  | "media"
  | "culture"
  | "other";

export type MarketStatus = "active" | "halted" | "resolved_yes" | "resolved_no";

export type MarketSortOption = "trending" | "newest" | "resolving_soon" | "biggest_movers" | "volume";

export interface MarketFilters {
  category?: MarketCategory;
  status?: MarketStatus;
  sort?: MarketSortOption;
  search?: string;
}

// Gemini API raw types

export interface GeminiEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  type: "binary" | "categorical";
  category: string;
  series: string | null;
  ticker: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  effectiveDate: string;
  expiryDate: string;
  isLive?: boolean;
  volume: string;
  volume24h: string;
  tags: string[];
  contracts: GeminiContract[];
  source?: string;
  termsLink?: string;
  subcategory?: {
    id: number;
    slug: string;
    name: string;
    path: string[];
  };
}

export interface GeminiContract {
  id: string;
  label: string;
  description: unknown;
  prices: {
    buy: { yes?: string; no?: string };
    sell: { yes?: string; no?: string };
    bestBid?: string;
    bestAsk?: string;
    lastTradePrice?: string;
  };
  status: string;
  ticker: string;
  instrumentSymbol: string;
  marketState: string;
  abbreviatedName?: string;
  color?: string;
  expiryDate: string;
  effectiveDate: string;
  sortOrder?: number;
  strike?: { type: string; value: string };
  source?: string;
}

export interface GeminiEventsResponse {
  data: GeminiEvent[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
