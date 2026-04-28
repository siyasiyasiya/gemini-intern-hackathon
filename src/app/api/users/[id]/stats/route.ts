import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userTrades, constellationMembers, comments } from "@/lib/db/schema";
import { eq, and, isNotNull, sql, desc, asc } from "drizzle-orm";
import { getUserGeminiCredentials, fetchPositions, fetchSettledPositions, fetchOrderHistory } from "@/lib/market-data/gemini-authenticated";
import { resolveUser } from "@/lib/db/resolve-user";
import type { ApiResponse, UserStatsResponse, TradeDetail } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idOrUsername } = await params;

  try {
    const user = await resolveUser(idOrUsername);

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const id = user.id;

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
    let bestTrade: TradeDetail | null = null;
    let worstTrade: TradeDetail | null = null;
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

          // Best/worst from settled with full detail
          if (settled.length > 0) {
            const sorted = [...settled].sort(
              (a, b) => parseFloat(b.netProfit || "0") - parseFloat(a.netProfit || "0")
            );
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];

            bestTrade = {
              pnl: Math.round(parseFloat(best.netProfit || "0") * 100) / 100,
              market: best.symbol,
              direction: best.resolutionSide === "yes" ? "yes" : best.resolutionSide === "no" ? "no" : null,
              amount: Math.round(parseFloat(best.quantity || "0") * 100) / 100,
              price: Math.round(parseFloat(best.costBasis || "0") * 100) / 100,
              date: null,
              resolved: parseFloat(best.netProfit || "0") > 0 ? "won" : "lost",
            };
            worstTrade = {
              pnl: Math.round(parseFloat(worst.netProfit || "0") * 100) / 100,
              market: worst.symbol,
              direction: worst.resolutionSide === "yes" ? "yes" : worst.resolutionSide === "no" ? "no" : null,
              amount: Math.round(parseFloat(worst.quantity || "0") * 100) / 100,
              price: Math.round(parseFloat(worst.costBasis || "0") * 100) / 100,
              date: null,
              resolved: parseFloat(worst.netProfit || "0") > 0 ? "won" : "lost",
            };
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
        })
        .from(userTrades)
        .where(eq(userTrades.userId, id));

      totalTrades = tradeStats?.totalTrades || 0;
      totalPnl = tradeStats?.totalPnl || 0;
      winRate = totalTrades > 0 ? (tradeStats.wins || 0) / totalTrades : 0;

      const resolvedCondition = and(
        eq(userTrades.userId, id),
        isNotNull(userTrades.pnl)
      );

      // Fetch best trade row (highest PnL among resolved trades)
      const [bestRow] = await db
        .select({
          pnl: userTrades.pnl,
          marketTicker: userTrades.marketTicker,
          direction: userTrades.direction,
          amount: userTrades.amount,
          priceAtTrade: userTrades.priceAtTrade,
          createdAt: userTrades.createdAt,
        })
        .from(userTrades)
        .where(resolvedCondition)
        .orderBy(desc(userTrades.pnl))
        .limit(1);

      // Fetch worst trade row (lowest PnL among resolved trades)
      const [worstRow] = await db
        .select({
          pnl: userTrades.pnl,
          marketTicker: userTrades.marketTicker,
          direction: userTrades.direction,
          amount: userTrades.amount,
          priceAtTrade: userTrades.priceAtTrade,
          createdAt: userTrades.createdAt,
        })
        .from(userTrades)
        .where(resolvedCondition)
        .orderBy(asc(userTrades.pnl))
        .limit(1);

      if (bestRow?.pnl != null) {
        bestTrade = {
          pnl: Math.round(bestRow.pnl * 100) / 100,
          market: bestRow.marketTicker,
          direction: bestRow.direction,
          amount: Math.round(bestRow.amount * 100) / 100,
          price: Math.round(bestRow.priceAtTrade * 100) / 100,
          date: bestRow.createdAt.toISOString(),
          resolved: bestRow.pnl > 0 ? "won" : "lost",
        };
      }
      if (worstRow?.pnl != null) {
        worstTrade = {
          pnl: Math.round(worstRow.pnl * 100) / 100,
          market: worstRow.marketTicker,
          direction: worstRow.direction,
          amount: Math.round(worstRow.amount * 100) / 100,
          price: Math.round(worstRow.priceAtTrade * 100) / 100,
          date: worstRow.createdAt.toISOString(),
          resolved: worstRow.pnl > 0 ? "won" : "lost",
        };
      }

      dataSource = totalTrades > 0 ? "local" : "none";
    }

    const response: UserStatsResponse = {
      totalTrades,
      totalPnl: Math.round(totalPnl * 100) / 100,
      winRate: Math.round(winRate * 1000) / 1000,
      constellationsJoined: constellationStats?.constellationsJoined || 0,
      commentsPosted: commentStats?.commentsPosted || 0,
      bestTrade,
      worstTrade,
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
