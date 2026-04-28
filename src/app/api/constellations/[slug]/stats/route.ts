import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers, userTrades } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ApiResponse, ConstellationStatsResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    const [tradeStats] = await db
      .select({
        totalTrades: sql<number>`count(*)::int`,
        totalVolume: sql<number>`coalesce(sum(${userTrades.amount}), 0)`,
        resolved: sql<number>`count(*) filter (where ${userTrades.resolved} = true)`,
        wins: sql<number>`count(*) filter (where ${userTrades.pnl} > 0 and ${userTrades.resolved} = true)`,
      })
      .from(userTrades)
      .where(eq(userTrades.constellationId, constellation.id));

    const [memberStats] = await db
      .select({
        memberCount: sql<number>`count(distinct ${constellationMembers.userId})::int`,
      })
      .from(constellationMembers)
      .where(eq(constellationMembers.constellationId, constellation.id));

    const resolved = tradeStats?.resolved || 0;
    const wins = tradeStats?.wins || 0;
    const collectiveAccuracy = resolved > 0 ? wins / resolved : 0;

    const response: ConstellationStatsResponse = {
      collectiveAccuracy: Math.round(collectiveAccuracy * 1000) / 1000,
      totalVolume: tradeStats?.totalVolume || 0,
      totalTrades: tradeStats?.totalTrades || 0,
      memberCount: memberStats?.memberCount || 0,
    };

    return NextResponse.json<ApiResponse<ConstellationStatsResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to fetch constellation stats" }, { status: 500 });
  }
}
