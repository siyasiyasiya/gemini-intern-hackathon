import { NextRequest, NextResponse } from "next/server";
import { getMarketByTicker } from "@/lib/market-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const market = await getMarketByTicker(ticker);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json({ data: market });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch market";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
