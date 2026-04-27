import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ data: room });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}
