import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { generateInviteCode } from "@/lib/utils";

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

    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owners and moderators can generate invite codes" }, { status: 403 });
    }

    const code = generateInviteCode();
    const [updated] = await db
      .update(constellations)
      .set({ inviteCode: code })
      .where(eq(constellations.id, constellation.id))
      .returning();

    return NextResponse.json({ data: { inviteCode: updated.inviteCode } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }
}
