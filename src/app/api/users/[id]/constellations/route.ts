import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellationMembers, constellations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { resolveUser } from "@/lib/db/resolve-user";
import type { ApiResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();
    const user = await resolveUser(id);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isOwnProfile = session?.user?.id === user.id;

    const memberCountSql = sql<number>`(
      SELECT count(*)::int FROM constellation_members cm
      WHERE cm.constellation_id = ${constellations.id}
    )`.as("member_count");

    const rows = await db
      .select({
        id: constellations.id,
        name: constellations.name,
        slug: constellations.slug,
        description: constellations.description,
        about: constellations.about,
        rules: constellations.rules,
        bannerUrl: constellations.bannerUrl,
        categories: constellations.categories,
        isPublic: constellations.isPublic,
        inviteCode: constellations.inviteCode,
        creatorId: constellations.creatorId,
        memberCount: memberCountSql,
        createdAt: constellations.createdAt,
        updatedAt: constellations.updatedAt,
      })
      .from(constellationMembers)
      .innerJoin(
        constellations,
        eq(constellationMembers.constellationId, constellations.id)
      )
      .where(
        isOwnProfile
          ? eq(constellationMembers.userId, user.id)
          : and(
              eq(constellationMembers.userId, user.id),
              eq(constellations.isPublic, true)
            )
      );

    const data = rows.map((r) => ({
      ...r,
      memberCount: r.memberCount ?? 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch constellations" },
      { status: 500 }
    );
  }
}
