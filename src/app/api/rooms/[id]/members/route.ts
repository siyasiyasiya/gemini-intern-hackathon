import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roomMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await db
      .select({
        id: roomMembers.id,
        role: roomMembers.role,
        joinedAt: roomMembers.joinedAt,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, id));

    return NextResponse.json({ data: members });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
