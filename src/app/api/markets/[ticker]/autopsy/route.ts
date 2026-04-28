import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users, constellations } from "@/lib/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { fetchGeminiEvent, fetchContractCandles, getFeaturedContract } from "@/lib/market-data/gemini-api";
import { detectInflectionPoints } from "@/lib/autopsy/inflection-detection";
import type { AutopsyComment, AutopsyResponse, InflectionPointWithContext } from "@/lib/autopsy/types";
import type { ApiResponse } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    // 1. Fetch market from Gemini
    const event = await fetchGeminiEvent(ticker);
    if (!event) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // 2. Fetch price candles
    const msLeft = new Date(event.expiryDate).getTime() - Date.now();
    const hoursLeft = msLeft / (1000 * 60 * 60);
    let timeframe: "5m" | "1hr" | "6hr" | "1day" = "1day";
    if (hoursLeft < 6) timeframe = "5m";
    else if (hoursLeft < 48) timeframe = "1hr";
    else if (hoursLeft < 336) timeframe = "6hr";

    const featuredContract = getFeaturedContract(event.contracts);
    const priceHistory = featuredContract?.instrumentSymbol
      ? await fetchContractCandles(featuredContract.instrumentSymbol, timeframe)
      : [];

    // 3. Detect inflection points
    const inflectionPoints = detectInflectionPoints(priceHistory);

    // 4. Fetch cross-constellation comments for this ticker
    const commentRows = await db
      .select({
        id: comments.id,
        createdAt: comments.createdAt,
        content: comments.content,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        positionDirection: comments.positionDirection,
        positionAmount: comments.positionAmount,
        likeCount: sql<number>`(
          SELECT count(*)::int FROM comment_likes cl WHERE cl.comment_id = ${comments.id}
        )`,
        constellationName: constellations.name,
        constellationSlug: constellations.slug,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(constellations, eq(comments.constellationId, constellations.id))
      .where(
        sql`(${comments.marketTicker} = ${ticker} OR ${ticker} = ANY(${comments.taggedMarkets}))`
      )
      .orderBy(asc(comments.createdAt));

    const autopsyComments: AutopsyComment[] = commentRows.map((r) => ({
      id: r.id,
      timestamp: r.createdAt.toISOString(),
      content: r.content,
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      positionDirection: r.positionDirection,
      positionAmount: r.positionAmount,
      likeCount: r.likeCount ?? 0,
      constellationName: r.constellationName,
      constellationSlug: r.constellationSlug,
    }));

    // 5. Associate comments with nearest inflection points
    const inflectionsWithContext: InflectionPointWithContext[] = inflectionPoints.map((ip) => {
      const windowStart = new Date(ip.windowStart).getTime();
      const windowEnd = new Date(ip.windowEnd).getTime();
      // Expand window by 20% on each side for comment matching
      const span = windowEnd - windowStart || 86400000;
      const expandedStart = windowStart - span * 0.2;
      const expandedEnd = windowEnd + span * 0.2;

      const related = autopsyComments.filter((c) => {
        const t = new Date(c.timestamp).getTime();
        return t >= expandedStart && t <= expandedEnd;
      });

      return { ...ip, externalEvent: null, relatedComments: related };
    });

    const description =
      typeof event.description === "string" ? event.description : "";

    const response: AutopsyResponse = {
      market: {
        ticker: event.ticker,
        title: event.title,
        status: event.status,
        category: event.category,
      },
      priceHistory,
      inflectionPoints: inflectionsWithContext,
      comments: autopsyComments,
      metadata: {
        timeframe,
        candleCount: priceHistory.length,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("Autopsy API error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to generate autopsy" },
      { status: 500 }
    );
  }
}
