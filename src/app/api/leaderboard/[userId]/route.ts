import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userTrades } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";

interface UserRankResponse {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [stats] = await db
      .select({
        totalTrades: sql<number>`count(*)::int`,
        totalPnl: sql<number>`coalesce(sum(${userTrades.pnl}), 0)`,
        wins: sql<number>`count(*) filter (where ${userTrades.pnl} > 0)`,
      })
      .from(userTrades)
      .where(eq(userTrades.userId, userId));

    const totalTrades = stats?.totalTrades || 0;
    const winRate = totalTrades > 0 ? (stats.wins || 0) / totalTrades : 0;

    const response: UserRankResponse = {
      rank: 0,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      totalPnl: stats?.totalPnl || 0,
      totalTrades,
      winRate: Math.round(winRate * 1000) / 1000,
    };

    return NextResponse.json<ApiResponse<UserRankResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user rank" },
      { status: 500 }
    );
  }
}
