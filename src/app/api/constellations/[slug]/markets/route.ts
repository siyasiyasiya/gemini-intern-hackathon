import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMarkets } from "@/lib/market-data";
import type { MarketCategory } from "@/types/market";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const constellation = await db.query.constellations.findFirst({
    where: eq(constellations.slug, slug),
    columns: { topic: true },
  });

  if (!constellation) {
    return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
  }

  const markets = getMarkets({
    category: constellation.topic as MarketCategory,
  });

  return NextResponse.json({ data: markets });
}
