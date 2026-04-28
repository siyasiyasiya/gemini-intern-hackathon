import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers, userTrades } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface ConstellationLeaderboardEntry {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  memberCount: number;
  totalTrades: number;
  totalVolume: number;
  collectiveAccuracy: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  try {
    const rows = await db
      .select({
        id: constellations.id,
        name: constellations.name,
        slug: constellations.slug,
        categories: constellations.categories,
        memberCount: constellations.memberCount,
        totalTrades: sql<number>`coalesce(count(${userTrades.id}), 0)::int`,
        totalVolume: sql<number>`coalesce(sum(${userTrades.amount}), 0)`,
        resolved: sql<number>`count(*) filter (where ${userTrades.resolved} = true)`,
        wins: sql<number>`count(*) filter (where ${userTrades.pnl} > 0 and ${userTrades.resolved} = true)`,
      })
      .from(constellations)
      .leftJoin(userTrades, eq(userTrades.constellationId, constellations.id))
      .where(eq(constellations.isPublic, true))
      .groupBy(constellations.id)
      .orderBy(desc(sql`coalesce(sum(${userTrades.amount}), 0)`))
      .limit(limit);

    const entries: ConstellationLeaderboardEntry[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      categories: r.categories,
      memberCount: r.memberCount,
      totalTrades: r.totalTrades,
      totalVolume: r.totalVolume,
      collectiveAccuracy: r.resolved > 0 ? Math.round((r.wins / r.resolved) * 1000) / 1000 : 0,
    }));

    return NextResponse.json({ data: entries });
  } catch {
    return NextResponse.json({ error: "Failed to fetch constellation leaderboard" }, { status: 500 });
  }
}
