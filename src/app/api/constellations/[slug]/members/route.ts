import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json({ error: "Constellation not found" }, { status: 404 });
    }

    const members = await db
      .select({
        id: constellationMembers.id,
        role: constellationMembers.role,
        joinedAt: constellationMembers.joinedAt,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(constellationMembers)
      .innerJoin(users, eq(constellationMembers.userId, users.id))
      .where(eq(constellationMembers.constellationId, constellation.id));

    return NextResponse.json({ data: members });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
