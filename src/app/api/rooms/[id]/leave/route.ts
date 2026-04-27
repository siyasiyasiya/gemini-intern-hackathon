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
    const [membership] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, session.user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    if (membership.role === "owner") {
      return NextResponse.json({ error: "Owner cannot leave the room" }, { status: 400 });
    }

    await db
      .delete(roomMembers)
      .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, session.user.id)));

    await db
      .update(rooms)
      .set({ memberCount: sql`GREATEST(${rooms.memberCount} - 1, 0)` })
      .where(eq(rooms.id, id));

    return NextResponse.json({ data: { left: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}
