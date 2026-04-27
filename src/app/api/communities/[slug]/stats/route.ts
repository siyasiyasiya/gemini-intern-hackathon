import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers, userTrades } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ApiResponse, CommunityStatsResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [community] = await db
      .select({ id: communities.id })
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1);

    if (!community) {
      return NextResponse.json<ApiResponse<null>>({ error: "Community not found" }, { status: 404 });
    }

    const [tradeStats] = await db
      .select({
        totalTrades: sql<number>`count(*)::int`,
        totalVolume: sql<number>`coalesce(sum(${userTrades.amount}), 0)`,
        resolved: sql<number>`count(*) filter (where ${userTrades.resolved} = true)`,
        wins: sql<number>`count(*) filter (where ${userTrades.pnl} > 0 and ${userTrades.resolved} = true)`,
      })
      .from(userTrades)
      .where(eq(userTrades.communityId, community.id));

    const [memberStats] = await db
      .select({
        activeMemberCount: sql<number>`count(distinct ${communityMembers.userId})::int`,
      })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, community.id));

    const resolved = tradeStats?.resolved || 0;
    const wins = tradeStats?.wins || 0;
    const collectiveAccuracy = resolved > 0 ? wins / resolved : 0;

    const response: CommunityStatsResponse = {
      collectiveAccuracy: Math.round(collectiveAccuracy * 1000) / 1000,
      totalVolume: tradeStats?.totalVolume || 0,
      totalTrades: tradeStats?.totalTrades || 0,
      activeMemberCount: memberStats?.activeMemberCount || 0,
    };

    return NextResponse.json<ApiResponse<CommunityStatsResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to fetch community stats" }, { status: 500 });
  }
}
