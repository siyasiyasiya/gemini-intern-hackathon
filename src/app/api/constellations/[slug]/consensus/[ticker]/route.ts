import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers, userTrades } from "@/lib/db/schema";
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

    // Only count trades from current constellation members
    const [result] = await db
      .select({
        yesAmount: sql<number>`coalesce(sum(${userTrades.amount}) filter (where ${userTrades.direction} = 'yes'), 0)`,
        noAmount: sql<number>`coalesce(sum(${userTrades.amount}) filter (where ${userTrades.direction} = 'no'), 0)`,
        totalMembers: sql<number>`count(distinct ${userTrades.userId})`,
      })
      .from(userTrades)
      .innerJoin(
        constellationMembers,
        and(
          eq(userTrades.userId, constellationMembers.userId),
          eq(constellationMembers.constellationId, constellation.id)
        )
      )
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
      totalPositions: result?.totalMembers || 0,
      yesAmount,
      noAmount,
    };

    return NextResponse.json<ApiResponse<ConsensusData>>({ data });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to fetch consensus data" }, { status: 500 });
  }
}
