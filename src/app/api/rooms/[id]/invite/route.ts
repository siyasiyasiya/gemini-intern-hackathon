import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { generateInviteCode } from "@/lib/utils";

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

    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owners and moderators can generate invite codes" }, { status: 403 });
    }

    const code = generateInviteCode();
    const [updated] = await db
      .update(rooms)
      .set({ inviteCode: code })
      .where(eq(rooms.id, id))
      .returning();

    return NextResponse.json({ data: { inviteCode: updated.inviteCode } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }
}
