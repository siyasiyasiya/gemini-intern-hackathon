import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, userTrades } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { ApiResponse, ConsensusData } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; ticker: string }> }
) {
  const { slug, ticker } = await params;

  try {
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    const [result] = await db
      .select({
        yesAmount: sql<number>`coalesce(sum(${userTrades.amount}) filter (where ${userTrades.direction} = 'yes'), 0)`,
        noAmount: sql<number>`coalesce(sum(${userTrades.amount}) filter (where ${userTrades.direction} = 'no'), 0)`,
        yesCount: sql<number>`count(distinct ${userTrades.userId}) filter (where ${userTrades.direction} = 'yes')`,
        noCount: sql<number>`count(distinct ${userTrades.userId}) filter (where ${userTrades.direction} = 'no')`,
      })
      .from(userTrades)
      .where(
        and(
          eq(userTrades.constellationId, constellation.id),
          eq(userTrades.marketTicker, ticker)
        )
      );

    const yesAmount = result?.yesAmount || 0;
    const noAmount = result?.noAmount || 0;
    const total = yesAmount + noAmount;

    if (total === 0) {
      return NextResponse.json<ApiResponse<null>>({ data: null });
    }

    const data: ConsensusData = {
      consensusPercent: yesAmount / total,
      totalPositions: (result?.yesCount || 0) + (result?.noCount || 0),
      yesAmount,
      noAmount,
      yesCount: result?.yesCount || 0,
      noCount: result?.noCount || 0,
    };

    return NextResponse.json<ApiResponse<ConsensusData>>({ data });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to fetch consensus data" }, { status: 500 });
  }
}
