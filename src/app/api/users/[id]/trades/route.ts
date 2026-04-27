import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userTrades } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";

interface TradeResponse {
  id: string;
  marketTicker: string;
  direction: "yes" | "no";
  amount: number;
  priceAtTrade: number;
  resolved: boolean;
  pnl: number | null;
  createdAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

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

    const trades = await db
      .select({
        id: userTrades.id,
        marketTicker: userTrades.marketTicker,
        direction: userTrades.direction,
        amount: userTrades.amount,
        priceAtTrade: userTrades.priceAtTrade,
        resolved: userTrades.resolved,
        pnl: userTrades.pnl,
        createdAt: userTrades.createdAt,
      })
      .from(userTrades)
      .where(eq(userTrades.userId, id))
      .orderBy(desc(userTrades.createdAt))
      .limit(limit);

    const response: TradeResponse[] = trades.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<TradeResponse[]>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user trades" },
      { status: 500 }
    );
  }
}
