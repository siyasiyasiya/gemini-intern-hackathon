import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
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
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1);

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, session.user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    if (membership.role === "owner") {
      return NextResponse.json({ error: "Owner cannot leave the community" }, { status: 400 });
    }

    await db
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, session.user.id)));

    await db
      .update(communities)
      .set({ memberCount: sql`GREATEST(${communities.memberCount} - 1, 0)` })
      .where(eq(communities.id, community.id));

    return NextResponse.json({ data: { left: true } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to leave community" }, { status: 500 });
  }
}
