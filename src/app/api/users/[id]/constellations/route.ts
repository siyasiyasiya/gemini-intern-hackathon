import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellationMembers, constellations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveUser } from "@/lib/db/resolve-user";
import type { ApiResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const user = await resolveUser(id);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const rows = await db
      .select({
        id: constellations.id,
        name: constellations.name,
        slug: constellations.slug,
        topic: constellations.topic,
      })
      .from(constellationMembers)
      .innerJoin(
        constellations,
        eq(constellationMembers.constellationId, constellations.id)
      )
      .where(eq(constellationMembers.userId, user.id));

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch constellations" },
      { status: 500 }
    );
  }
}
