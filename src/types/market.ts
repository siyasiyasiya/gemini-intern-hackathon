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
}

export interface MarketDetail extends Market {
  resolutionSource: string;
  history: PricePoint[];
  relatedTickers: string[];
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
  | "other";

export type MarketStatus = "active" | "halted" | "resolved_yes" | "resolved_no";

export type MarketSortOption = "trending" | "newest" | "resolving_soon" | "biggest_movers" | "volume";

export interface MarketFilters {
  category?: MarketCategory;
  status?: MarketStatus;
  sort?: MarketSortOption;
  search?: string;
}
