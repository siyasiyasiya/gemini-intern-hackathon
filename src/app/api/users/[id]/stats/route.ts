import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userTrades, constellationMembers, comments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getUserGeminiCredentials, fetchPositions, fetchSettledPositions, fetchOrderHistory } from "@/lib/market-data/gemini-authenticated";
import type { ApiResponse, UserStatsResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [user] = await db
      .select({ id: users.id, geminiApiKeyEnc: users.geminiApiKeyEnc })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // DB stats (constellations + comments)
    const [constellationStats, commentStats] = await Promise.all([
      db
        .select({ constellationsJoined: sql<number>`count(*)::int` })
        .from(constellationMembers)
        .where(eq(constellationMembers.userId, id))
        .then((r) => r[0]),
      db
        .select({ commentsPosted: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.userId, id))
        .then((r) => r[0]),
    ]);

    const geminiConnected = !!user.geminiApiKeyEnc;
    let totalTrades = 0;
    let totalPnl = 0;
    let winRate = 0;
    let bestTrade = 0;
    let worstTrade = 0;
    let dataSource: "gemini" | "local" | "none" = "none";

    if (geminiConnected) {
      try {
        const creds = await getUserGeminiCredentials(id);
        if (creds) {
          const [positionsResult, settledResult, ordersResult] = await Promise.allSettled([
            fetchPositions(creds.apiKey, creds.apiSecret),
            fetchSettledPositions(creds.apiKey, creds.apiSecret),
            fetchOrderHistory(creds.apiKey, creds.apiSecret),
          ]);

          const positions = positionsResult.status === "fulfilled" ? positionsResult.value : [];
          const settled = settledResult.status === "fulfilled" ? settledResult.value : [];
          const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];

          // Count filled orders as trades
          const filledOrders = orders.filter(
            (o) => o.status === "closed" || parseFloat(o.filledQuantity || "0") > 0
          );
          totalTrades = filledOrders.length;

          // P&L from active positions
          const activePnl = positions.reduce(
            (sum, p) => sum + parseFloat(p.realizedPl || "0"),
            0
          );

          // P&L from settled positions
          const settledPnl = settled.reduce(
            (sum, p) => sum + parseFloat(p.netProfit || "0"),
            0
          );

          totalPnl = activePnl + settledPnl;

          // Win rate from settled positions
          const wins = settled.filter((p) => parseFloat(p.netProfit || "0") > 0).length;
          const totalSettled = settled.length;
          winRate = totalSettled > 0 ? wins / totalSettled : 0;

          // Best/worst from settled
          if (settled.length > 0) {
            const profits = settled.map((p) => parseFloat(p.netProfit || "0"));
            bestTrade = Math.max(...profits);
            worstTrade = Math.min(...profits);
          }

          dataSource = "gemini";
        }
      } catch {
        // Gemini calls failed — fall back to zeros
      }
    } else {
      // Fallback to local trades table
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

      totalTrades = tradeStats?.totalTrades || 0;
      totalPnl = tradeStats?.totalPnl || 0;
      winRate = totalTrades > 0 ? (tradeStats.wins || 0) / totalTrades : 0;
      bestTrade = tradeStats?.bestTrade || 0;
      worstTrade = tradeStats?.worstTrade || 0;
      dataSource = totalTrades > 0 ? "local" : "none";
    }

    const response: UserStatsResponse = {
      totalTrades,
      totalPnl: Math.round(totalPnl * 100) / 100,
      winRate: Math.round(winRate * 1000) / 1000,
      constellationsJoined: constellationStats?.constellationsJoined || 0,
      commentsPosted: commentStats?.commentsPosted || 0,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      geminiConnected,
      dataSource,
    };

    return NextResponse.json<ApiResponse<UserStatsResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
