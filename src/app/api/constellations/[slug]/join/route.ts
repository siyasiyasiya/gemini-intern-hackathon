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

    if (!constellation.isPublic) {
      return NextResponse.json(
        { error: "This constellation is private. Use an invite link to join." },
        { status: 403 }
      );
    }

    const [existing] = await db
      .select()
      .from(constellationMembers)
      .where(and(eq(constellationMembers.constellationId, constellation.id), eq(constellationMembers.userId, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
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

    return NextResponse.json({ data: { joined: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join constellation" }, { status: 500 });
  }
}
