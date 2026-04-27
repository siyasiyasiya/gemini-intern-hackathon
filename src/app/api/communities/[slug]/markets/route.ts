import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMarkets } from "@/lib/market-data";
import type { MarketCategory } from "@/types/market";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
    columns: { topic: true },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const markets = getMarkets({
    category: community.topic as MarketCategory,
  });

  return NextResponse.json({ data: markets });
}
