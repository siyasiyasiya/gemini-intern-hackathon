import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, userTrades } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getMarkets } from "@/lib/market-data";

export async function GET() {
  try {
    const [marketsResult, dbStats] = await Promise.all([
      getMarkets({ sort: "trending" }).then((m) => m.length).catch(() => 0),
      db
        .select({
          constellations: sql<number>`(SELECT COUNT(*)::int FROM ${constellations})`,
          traders: sql<number>`(SELECT COUNT(DISTINCT user_id)::int FROM ${userTrades})`,
        })
        .from(constellations)
        .limit(1),
    ]);

    const row = dbStats[0] || { constellations: 0, traders: 0 };

    return NextResponse.json({
      data: {
        activeMarkets: marketsResult,
        constellations: row.constellations,
        traders: row.traders,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
