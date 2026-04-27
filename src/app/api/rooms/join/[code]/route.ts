import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.inviteCode, code))
      .limit(1);

    if (!room) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ data: { roomId: room.id, alreadyMember: true } });
    }

    await db.insert(roomMembers).values({
      roomId: room.id,
      userId: session.user.id,
      role: "member",
    });

    await db
      .update(rooms)
      .set({ memberCount: sql`${rooms.memberCount} + 1` })
      .where(eq(rooms.id, room.id));

    return NextResponse.json({ data: { roomId: room.id, joined: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join via invite" }, { status: 500 });
  }
}
