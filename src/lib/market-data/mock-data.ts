import type { Market, MarketDetail, PricePoint, MarketCategory } from "@/types/market";

function generateHistory(basePrice: number, days: number): PricePoint[] {
  const points: PricePoint[] = [];
  let price = basePrice - 0.15 + Math.random() * 0.1;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * 0.04;
    price = Math.max(0.02, Math.min(0.98, price + drift));
    points.push({
      timestamp: new Date(now - i * 86400000).toISOString(),
      yesPrice: Math.round(price * 100) / 100,
      volume: Math.floor(5000 + Math.random() * 50000),
    });
  }

  // Ensure last point matches current price
  if (points.length > 0) {
    points[points.length - 1].yesPrice = basePrice;
  }
  return points;
}

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString();
}

export const MOCK_MARKETS: Market[] = [
  {
    ticker: "FED-RATE-CUT-JUL",
    title: "Will the Fed cut rates in July 2026?",
    description: "Resolves YES if the Federal Reserve announces a rate cut at or before the July 2026 FOMC meeting.",
    category: "economics",
    yesPrice: 0.62,
    noPrice: 0.38,
    volume24h: 284000,
    totalVolume: 4200000,
    resolutionDate: futureDate(90),
    status: "active",
    changePercent24h: 3.2,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    ticker: "BTC-100K-Q3",
    title: "Bitcoin above $100K end of Q3 2026?",
    description: "Resolves YES if Bitcoin (BTC/USD) closes above $100,000 on the last trading day of Q3 2026.",
    category: "crypto",
    yesPrice: 0.71,
    noPrice: 0.29,
    volume24h: 512000,
    totalVolume: 8100000,
    resolutionDate: futureDate(150),
    status: "active",
    changePercent24h: -1.8,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    ticker: "PRES-APPROVAL-50",
    title: "Presidential approval above 50% by August?",
    description: "Resolves YES if the RealClearPolitics average presidential approval rating is above 50% on Aug 1, 2026.",
    category: "politics",
    yesPrice: 0.34,
    noPrice: 0.66,
    volume24h: 178000,
    totalVolume: 3400000,
    resolutionDate: futureDate(95),
    status: "active",
    changePercent24h: -2.1,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    ticker: "NBA-FINALS-BOS",
    title: "Celtics win 2026 NBA Finals?",
    description: "Resolves YES if the Boston Celtics win the 2026 NBA Championship.",
    category: "sports",
    yesPrice: 0.28,
    noPrice: 0.72,
    volume24h: 95000,
    totalVolume: 1800000,
    resolutionDate: futureDate(60),
    status: "active",
    changePercent24h: 5.4,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    ticker: "ETH-MERGE-V2",
    title: "Ethereum Pectra upgrade by June 2026?",
    description: "Resolves YES if Ethereum successfully deploys the Pectra upgrade to mainnet by June 30, 2026.",
    category: "crypto",
    yesPrice: 0.85,
    noPrice: 0.15,
    volume24h: 67000,
    totalVolume: 920000,
    resolutionDate: futureDate(60),
    status: "active",
    changePercent24h: 0.5,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    ticker: "AI-AGI-2026",
    title: "Major AI lab claims AGI by end of 2026?",
    description: "Resolves YES if OpenAI, Google DeepMind, or Anthropic publicly claims to have achieved AGI by Dec 31, 2026.",
    category: "technology",
    yesPrice: 0.12,
    noPrice: 0.88,
    volume24h: 340000,
    totalVolume: 5600000,
    resolutionDate: futureDate(245),
    status: "active",
    changePercent24h: 1.2,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    ticker: "OSCAR-BEST-PIC",
    title: "Will a streaming-only film win Best Picture 2027?",
    description: "Resolves YES if the 2027 Academy Award for Best Picture goes to a film that premiered exclusively on a streaming platform.",
    category: "entertainment",
    yesPrice: 0.41,
    noPrice: 0.59,
    volume24h: 42000,
    totalVolume: 680000,
    resolutionDate: futureDate(300),
    status: "active",
    changePercent24h: -0.3,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    ticker: "MARS-SAMPLE-2026",
    title: "Mars sample return mission launches in 2026?",
    description: "Resolves YES if NASA or ESA launches a Mars sample return mission in calendar year 2026.",
    category: "science",
    yesPrice: 0.08,
    noPrice: 0.92,
    volume24h: 23000,
    totalVolume: 450000,
    resolutionDate: futureDate(245),
    status: "active",
    changePercent24h: -0.8,
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    ticker: "SP500-5500-EOY",
    title: "S&P 500 above 5500 end of 2026?",
    description: "Resolves YES if the S&P 500 index closes above 5500 on the last trading day of 2026.",
    category: "economics",
    yesPrice: 0.58,
    noPrice: 0.42,
    volume24h: 198000,
    totalVolume: 3100000,
    resolutionDate: futureDate(245),
    status: "active",
    changePercent24h: 1.7,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    ticker: "FIFA-WC-HOST",
    title: "Will FIFA announce 2034 World Cup host by Sep 2026?",
    description: "Resolves YES if FIFA officially announces the host nation for the 2034 World Cup by Sep 30, 2026.",
    category: "sports",
    yesPrice: 0.73,
    noPrice: 0.27,
    volume24h: 31000,
    totalVolume: 520000,
    resolutionDate: futureDate(155),
    status: "active",
    changePercent24h: 0.0,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    ticker: "SOL-ETF-APPROVE",
    title: "Solana ETF approved by SEC in 2026?",
    description: "Resolves YES if the SEC approves a spot Solana ETF in calendar year 2026.",
    category: "crypto",
    yesPrice: 0.45,
    noPrice: 0.55,
    volume24h: 156000,
    totalVolume: 2400000,
    resolutionDate: futureDate(245),
    status: "active",
    changePercent24h: 4.1,
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    ticker: "SENATE-FLIP-2026",
    title: "Democrats win Senate majority in 2026 midterms?",
    description: "Resolves YES if Democrats hold 50+ seats (or 50 with VP tiebreaker) after the 2026 midterm elections.",
    category: "politics",
    yesPrice: 0.52,
    noPrice: 0.48,
    volume24h: 267000,
    totalVolume: 4800000,
    resolutionDate: futureDate(190),
    status: "active",
    changePercent24h: -0.6,
    createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
  },
];

export function getMarketsByCategory(category: MarketCategory): Market[] {
  return MOCK_MARKETS.filter((m) => m.category === category);
}

export function getMarketByTicker(ticker: string): MarketDetail | undefined {
  const market = MOCK_MARKETS.find((m) => m.ticker === ticker);
  if (!market) return undefined;

  return {
    ...market,
    resolutionSource: "Official sources / Associated Press",
    history: generateHistory(market.yesPrice, 30),
    relatedTickers: MOCK_MARKETS.filter(
      (m) => m.category === market.category && m.ticker !== ticker
    )
      .slice(0, 3)
      .map((m) => m.ticker),
  };
}

export function searchMarkets(query: string): Market[] {
  const lower = query.toLowerCase();
  return MOCK_MARKETS.filter(
    (m) =>
      m.title.toLowerCase().includes(lower) ||
      m.ticker.toLowerCase().includes(lower) ||
      m.description.toLowerCase().includes(lower)
  );
}
