import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers } from "@/lib/db/schema";
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
    const [constellation] = await db
      .select()
      .from(constellations)
      .where(eq(constellations.inviteCode, code))
      .limit(1);

    if (!constellation) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(constellationMembers)
      .where(and(eq(constellationMembers.constellationId, constellation.id), eq(constellationMembers.userId, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ data: { constellationSlug: constellation.slug, alreadyMember: true } });
    }

    await db.insert(constellationMembers).values({
      constellationId: constellation.id,
      userId: session.user.id,
      role: "member",
    });

    await db
      .update(constellations)
      .set({ memberCount: sql`${constellations.memberCount} + 1` })
      .where(eq(constellations.id, constellation.id));

    return NextResponse.json({ data: { constellationSlug: constellation.slug, joined: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join via invite" }, { status: 500 });
  }
}
