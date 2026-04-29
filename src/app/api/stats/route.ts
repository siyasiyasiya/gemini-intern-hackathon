import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, userTrades } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const dbStats = await db
      .select({
        constellations: sql<number>`(SELECT COUNT(*)::int FROM ${constellations})`,
        traders: sql<number>`(SELECT COUNT(DISTINCT user_id)::int FROM ${userTrades})`,
      })
      .from(constellations)
      .limit(1);

    const row = dbStats[0] || { constellations: 0, traders: 0 };

    return NextResponse.json({
      data: {
        activeMarkets: 0,
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
