import { NextRequest, NextResponse } from "next/server";
import { getMarketByTicker } from "@/lib/market-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const market = getMarketByTicker(ticker);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  return NextResponse.json({ data: market });
}
