import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { constellations, constellationMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, ilike, and, desc, sql, count } from "drizzle-orm";
import { generateInviteCode, generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 12;

    const conditions = [eq(constellations.isPublic, true)];
    if (topic && topic !== "all") {
      conditions.push(eq(constellations.topic, topic as any));
    }
    if (search) {
      conditions.push(ilike(constellations.name, `%${search}%`));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [constellationsList, totalResult] = await Promise.all([
      db
        .select()
        .from(constellations)
        .where(where)
        .orderBy(desc(constellations.memberCount), desc(constellations.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(constellations).where(where),
    ]);

    return NextResponse.json({
      data: constellationsList,
      total: totalResult[0].count,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch constellations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, topic, isPublic, about, rules, bannerUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Constellation name is required" }, { status: 400 });
    }

    let slug = body.slug?.trim() || generateSlug(name);

    // Ensure slug uniqueness by appending a random suffix if needed
    const [existing] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const [constellation] = await db
      .insert(constellations)
      .values({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        about: about?.trim() || null,
        rules: rules?.trim() || null,
        bannerUrl: bannerUrl?.trim() || null,
        topic: topic || "other",
        isPublic: isPublic ?? true,
        inviteCode: generateInviteCode(),
        creatorId: session.user.id,
        memberCount: 1,
      })
      .returning();

    await db.insert(constellationMembers).values({
      constellationId: constellation.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json({ data: constellation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create constellation" }, { status: 500 });
  }
}
