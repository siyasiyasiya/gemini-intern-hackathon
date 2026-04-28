import type { PricePoint } from "@/types/market";

export interface InflectionPoint {
  id: string;
  timestamp: string;
  windowStart: string;
  windowEnd: string;
  priceAtPoint: number;
  priceBefore: number;
  priceAfter: number;
  priceChangePercent: number;
  volumeSpike: number;
  compositeScore: number;
  direction: "up" | "down";
}

export interface ExternalEvent {
  headline: string;
  summary: string;
  sources: { title: string; url: string; publishedAt: string }[];
  confidence: number;
  eventType: "news" | "data_release" | "speech" | "ruling" | "other";
}

export interface InflectionPointWithContext extends InflectionPoint {
  externalEvent: ExternalEvent | null;
  relatedComments: AutopsyComment[];
}

export interface AutopsyComment {
  id: string;
  timestamp: string;
  content: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  positionDirection: "yes" | "no" | null;
  positionAmount: number | null;
  likeCount: number;
  constellationName: string;
  constellationSlug: string;
}

export interface AutopsyResponse {
  market: { ticker: string; title: string; status: string; category: string };
  priceHistory: PricePoint[];
  inflectionPoints: InflectionPointWithContext[];
  comments: AutopsyComment[];
  metadata: { timeframe: string; candleCount: number; generatedAt: string };
}
