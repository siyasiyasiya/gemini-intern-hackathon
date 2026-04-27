import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userTrades, communityMembers, comments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ApiResponse, UserStatsResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [tradeStats] = await db
      .select({
        totalTrades: sql<number>`count(*)::int`,
        totalPnl: sql<number>`coalesce(sum(${userTrades.pnl}), 0)`,
        wins: sql<number>`count(*) filter (where ${userTrades.pnl} > 0)`,
        bestTrade: sql<number>`coalesce(max(${userTrades.pnl}), 0)`,
        worstTrade: sql<number>`coalesce(min(${userTrades.pnl}), 0)`,
      })
      .from(userTrades)
      .where(eq(userTrades.userId, id));

    const [communityStats] = await db
      .select({
        communitiesJoined: sql<number>`count(*)::int`,
      })
      .from(communityMembers)
      .where(eq(communityMembers.userId, id));

    const [commentStats] = await db
      .select({
        commentsPosted: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(eq(comments.userId, id));

    const totalTrades = tradeStats?.totalTrades || 0;
    const winRate = totalTrades > 0 ? (tradeStats.wins || 0) / totalTrades : 0;

    const response: UserStatsResponse = {
      totalTrades,
      totalPnl: tradeStats?.totalPnl || 0,
      winRate: Math.round(winRate * 1000) / 1000,
      communitiesJoined: communityStats?.communitiesJoined || 0,
      commentsPosted: commentStats?.commentsPosted || 0,
      bestTrade: tradeStats?.bestTrade || 0,
      worstTrade: tradeStats?.worstTrade || 0,
    };

    return NextResponse.json<ApiResponse<UserStatsResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
