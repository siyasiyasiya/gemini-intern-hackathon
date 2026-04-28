import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations, constellationMembers, comments, commentLikes, users } from "@/lib/db/schema";
import { eq, and, isNull, desc, lt, sql, inArray, or } from "drizzle-orm";
import type { ApiResponse, FeedItemResponse } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const session = await auth();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const sort = searchParams.get("sort") || "latest";

  try {
    // Build accessible constellation IDs: all public + private ones user belongs to
    const publicRows = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.isPublic, true));

    const publicIds = publicRows.map((r) => r.id);

    let privateIds: string[] = [];
    if (session?.user?.id) {
      const memberRows = await db
        .select({ constellationId: constellationMembers.constellationId })
        .from(constellationMembers)
        .innerJoin(constellations, eq(constellationMembers.constellationId, constellations.id))
        .where(
          and(
            eq(constellationMembers.userId, session.user.id),
            eq(constellations.isPublic, false)
          )
        );
      privateIds = memberRows.map((r) => r.constellationId);
    }

    const accessibleIds = [...new Set([...publicIds, ...privateIds])];

    if (accessibleIds.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null });
    }

    // Build conditions: root-level comments mentioning this ticker
    const conditions = [
      isNull(comments.parentId),
      inArray(comments.constellationId, accessibleIds),
      or(
        eq(comments.marketTicker, ticker),
        sql`${ticker} = ANY(${comments.taggedMarkets})`
      ),
    ];

    if (sort === "latest" && cursor) {
      conditions.push(lt(comments.createdAt, new Date(cursor)));
    }

    const offset = sort === "trending" && cursor ? parseInt(cursor, 10) : 0;

    // Subqueries
    const replyCountSql = sql<number>`(
      SELECT count(*)::int FROM comments r WHERE r.parent_id = ${comments.id}
    )`.as("reply_count");

    const likeCountSql = sql<number>`(
      SELECT count(*)::int FROM comment_likes cl WHERE cl.comment_id = ${comments.id}
    )`.as("like_count");

    const likedByMeSql = session?.user?.id
      ? sql<boolean>`EXISTS(
          SELECT 1 FROM comment_likes cl
          WHERE cl.comment_id = ${comments.id} AND cl.user_id = ${session.user.id}
        )`.as("liked_by_me")
      : sql<boolean>`false`.as("liked_by_me");

    // Ordering
    let orderBy;
    if (sort === "trending") {
      const trendingScore = sql<number>`(
        (SELECT count(*)::int FROM comment_likes cl
         WHERE cl.comment_id = ${comments.id}
         AND cl.created_at > now() - interval '24 hours')
        +
        (SELECT count(*)::int FROM comments r
         WHERE r.parent_id = ${comments.id}
         AND r.created_at > now() - interval '24 hours')
      )`;
      orderBy = [desc(trendingScore), desc(comments.createdAt)];
    } else {
      orderBy = [desc(comments.createdAt)];
    }

    let query = db
      .select({
        id: comments.id,
        constellationId: comments.constellationId,
        userId: comments.userId,
        marketTicker: comments.marketTicker,
        parentId: comments.parentId,
        content: comments.content,
        positionDirection: comments.positionDirection,
        positionAmount: comments.positionAmount,
        positionContractLabel: comments.positionContractLabel,
        taggedMarkets: comments.taggedMarkets,
        createdAt: comments.createdAt,
        userName: users.username,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
        constellationName: constellations.name,
        constellationSlug: constellations.slug,
        constellationCategories: constellations.categories,
        replyCount: replyCountSql,
        likeCount: likeCountSql,
        likedByMe: likedByMeSql,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(constellations, eq(comments.constellationId, constellations.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit + 1)
      .$dynamic();

    if (sort === "trending" && offset > 0) {
      query = query.offset(offset);
    }

    const rows = await query;

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;
    if (hasMore) {
      if (sort === "trending") {
        nextCursor = String(offset + limit);
      } else {
        nextCursor = pageRows[pageRows.length - 1].createdAt.toISOString();
      }
    }

    const data: FeedItemResponse[] = pageRows.map((r) => ({
      id: r.id,
      constellationId: r.constellationId,
      userId: r.userId,
      marketTicker: r.marketTicker,
      parentId: r.parentId,
      content: r.content,
      positionDirection: r.positionDirection,
      positionAmount: r.positionAmount,
      positionContractLabel: r.positionContractLabel,
      taggedMarkets: r.taggedMarkets,
      likeCount: r.likeCount ?? 0,
      likedByMe: r.likedByMe ?? false,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.userId,
        username: r.userName,
        displayName: r.userDisplayName,
        avatarUrl: r.userAvatarUrl,
        bio: null,
        createdAt: "",
      },
      constellation: {
        id: r.constellationId,
        name: r.constellationName,
        slug: r.constellationSlug,
        topic: (r.constellationCategories as string[])?.[0] ?? "other",
      },
      replyCount: r.replyCount ?? 0,
    }));

    return NextResponse.json({ data, nextCursor });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch market comments" },
      { status: 500 }
    );
  }
}
