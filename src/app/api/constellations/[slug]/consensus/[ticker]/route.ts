import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers, userTrades, comments } from "@/lib/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import type { ApiResponse, ConsensusData, CategoricalConsensusData } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; ticker: string }> }
) {
  const { slug, ticker } = await params;
  const { searchParams } = new URL(request.url);
  const categorical = searchParams.get("categorical") === "true";

  try {
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    // Categorical: derive per-outcome consensus from comment positions
    if (categorical) {
      const rows = await db
        .select({
          label: comments.positionContractLabel,
          totalAmount: sql<number>`coalesce(sum(${comments.positionAmount}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(comments)
        .innerJoin(
          constellationMembers,
          and(
            eq(comments.userId, constellationMembers.userId),
            eq(constellationMembers.constellationId, constellation.id)
          )
        )
        .where(
          and(
            eq(comments.constellationId, constellation.id),
            eq(comments.marketTicker, ticker),
            isNotNull(comments.positionContractLabel),
            isNotNull(comments.positionAmount)
          )
        )
        .groupBy(comments.positionContractLabel);

      const totalAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPositions = rows.reduce((sum, r) => sum + r.count, 0);

      if (totalAmount === 0) {
        return NextResponse.json<ApiResponse<null>>({ data: null });
      }

      const outcomes = rows
        .map((r) => ({
          label: r.label!,
          amount: r.totalAmount,
          percent: r.totalAmount / totalAmount,
          count: r.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      const data: CategoricalConsensusData = {
        outcomes,
        totalPositions,
        totalAmount,
      };

      return NextResponse.json<ApiResponse<CategoricalConsensusData>>({ data });
    }

    // Binary: existing yes/no consensus from userTrades
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
