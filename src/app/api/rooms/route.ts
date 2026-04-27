import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, ilike, and, desc, sql, count } from "drizzle-orm";
import { generateInviteCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 12;

    const conditions = [eq(rooms.isPublic, true)];
    if (topic && topic !== "all") {
      conditions.push(eq(rooms.topic, topic as any));
    }
    if (search) {
      conditions.push(ilike(rooms.name, `%${search}%`));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [roomsList, totalResult] = await Promise.all([
      db
        .select()
        .from(rooms)
        .where(where)
        .orderBy(desc(rooms.memberCount), desc(rooms.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(rooms).where(where),
    ]);

    return NextResponse.json({
      data: roomsList,
      total: totalResult[0].count,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, topic, isPublic } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const [room] = await db
      .insert(rooms)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        topic: topic || "other",
        isPublic: isPublic ?? true,
        inviteCode: generateInviteCode(),
        creatorId: session.user.id,
        memberCount: 1,
      })
      .returning();

    await db.insert(roomMembers).values({
      roomId: room.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
