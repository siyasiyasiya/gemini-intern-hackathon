import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/market-data";
import type { MarketCategory, MarketSortOption, MarketStatus } from "@/types/market";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.get("category") as MarketCategory | null;
  const sort = searchParams.get("sort") as MarketSortOption | null;
  const search = searchParams.get("search");
  const status = searchParams.get("status") as MarketStatus | null;

  const markets = getMarkets({
    category: category || undefined,
    sort: sort || undefined,
    search: search || undefined,
    status: status || undefined,
  });

  return NextResponse.json({ data: markets });
}
