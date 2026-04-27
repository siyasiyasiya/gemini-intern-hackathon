import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMarkets } from "@/lib/market-data";
import type { MarketCategory } from "@/types/market";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    columns: { topic: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const markets = getMarkets({
    category: room.topic as MarketCategory,
  });

  return NextResponse.json({ data: markets });
}
