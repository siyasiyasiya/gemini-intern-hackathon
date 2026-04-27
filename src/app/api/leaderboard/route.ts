import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaderboardEntries, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ApiResponse, LeaderboardEntryResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all_time";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    const rows = await db
      .select({
        userId: leaderboardEntries.userId,
        totalPnl: leaderboardEntries.totalPnl,
        totalTrades: leaderboardEntries.totalTrades,
        winRate: leaderboardEntries.winRate,
        rank: leaderboardEntries.rank,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(leaderboardEntries)
      .innerJoin(users, eq(leaderboardEntries.userId, users.id))
      .where(eq(leaderboardEntries.period, period))
      .orderBy(desc(leaderboardEntries.totalPnl))
      .limit(limit);

    const leaderboard: LeaderboardEntryResponse[] = rows.map((row, i) => ({
      rank: row.rank ?? i + 1,
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      totalPnl: row.totalPnl,
      totalTrades: row.totalTrades,
      winRate: row.winRate,
    }));

    return NextResponse.json<ApiResponse<LeaderboardEntryResponse[]>>({
      data: leaderboard,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
