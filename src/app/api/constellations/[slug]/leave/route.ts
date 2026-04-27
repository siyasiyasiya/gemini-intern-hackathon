import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const [constellation] = await db
      .select()
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(constellationMembers)
      .where(and(eq(constellationMembers.constellationId, constellation.id), eq(constellationMembers.userId, session.user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    if (membership.role === "owner") {
      return NextResponse.json({ error: "Owner cannot leave the constellation" }, { status: 400 });
    }

    await db
      .delete(constellationMembers)
      .where(and(eq(constellationMembers.constellationId, constellation.id), eq(constellationMembers.userId, session.user.id)));

    await db
      .update(constellations)
      .set({ memberCount: sql`GREATEST(${constellations.memberCount} - 1, 0)` })
      .where(eq(constellations.id, constellation.id));

    return NextResponse.json({ data: { left: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to leave constellation" }, { status: 500 });
  }
}
