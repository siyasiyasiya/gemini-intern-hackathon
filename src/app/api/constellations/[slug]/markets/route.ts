import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, trackedMarkets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMarkets, getMarketsByTickers } from "@/lib/market-data";
import type { MarketCategory, Market } from "@/types/market";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const constellation = await db.query.constellations.findFirst({
      where: eq(constellations.slug, slug),
      columns: { id: true, categories: true },
    });

    if (!constellation) {
      return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
    }

    // Get watchlist tickers
    const tracked = await db
      .select({ marketTicker: trackedMarkets.marketTicker })
      .from(trackedMarkets)
      .where(eq(trackedMarkets.constellationId, constellation.id));

    const watchlistTickers = tracked.map((t) => t.marketTicker);

    // Fetch category markets + watchlist markets in parallel
    const categories = (constellation.categories || []) as MarketCategory[];
    const [categoryMarkets, watchlistMarkets] = await Promise.all([
      categories.length > 0 ? getMarkets({ categories }) : Promise.resolve([]),
      getMarketsByTickers(watchlistTickers),
    ]);

    // Merge and deduplicate by ticker
    const seen = new Set<string>();
    const merged: Market[] = [];
    for (const m of [...categoryMarkets, ...watchlistMarkets]) {
      if (!seen.has(m.ticker)) {
        seen.add(m.ticker);
        merged.push(m);
      }
    }

    return NextResponse.json({ data: merged, watchlistTickers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch constellation markets" }, { status: 500 });
  }
}
