import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    await db.insert(roomMembers).values({
      roomId: id,
      userId: session.user.id,
      role: "member",
    });

    await db
      .update(rooms)
      .set({ memberCount: sql`${rooms.memberCount} + 1` })
      .where(eq(rooms.id, id));

    return NextResponse.json({ data: { joined: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
