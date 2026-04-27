import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
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
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.inviteCode, code))
      .limit(1);

    if (!community) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, session.user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ data: { communitySlug: community.slug, alreadyMember: true } });
    }

    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: session.user.id,
      role: "member",
    });

    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, community.id));

    return NextResponse.json({ data: { communitySlug: community.slug, joined: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join via invite" }, { status: 500 });
  }
}
