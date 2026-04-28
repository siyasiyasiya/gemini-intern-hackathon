import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations, constellationMembers, comments, commentLikes, users } from "@/lib/db/schema";
import { eq, and, isNull, desc, lt, sql, inArray } from "drizzle-orm";
import type { ApiResponse, FeedItemResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const sort = searchParams.get("sort") || "latest";

  try {
    // Get constellation IDs the user has joined
    const memberRows = await db
      .select({ constellationId: constellationMembers.constellationId })
      .from(constellationMembers)
      .where(eq(constellationMembers.userId, session.user.id));

    const joinedIds = memberRows.map((r) => r.constellationId);

    if (joinedIds.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null });
    }

    // Build conditions: root-level comments from joined constellations
    const conditions = [
      isNull(comments.parentId),
      inArray(comments.constellationId, joinedIds),
    ];

    if (cursor) {
      conditions.push(lt(comments.createdAt, new Date(cursor)));
    }

    // Reply count subquery
    const replyCountSql = sql<number>`(
      SELECT count(*)::int FROM comments r WHERE r.parent_id = ${comments.id}
    )`.as("reply_count");

    // Like count subquery
    const likeCountSql = sql<number>`(
      SELECT count(*)::int FROM comment_likes cl WHERE cl.comment_id = ${comments.id}
    )`.as("like_count");

    // Whether the current user liked this comment
    const likedByMeSql = sql<boolean>`EXISTS(
      SELECT 1 FROM comment_likes cl
      WHERE cl.comment_id = ${comments.id} AND cl.user_id = ${session.user.id}
    )`.as("liked_by_me");

    // Determine ordering
    let orderBy;
    if (sort === "trending") {
      // Trending: likes + replies combined, weighted towards recency
      const trendingScore = sql<number>`(
        (SELECT count(*)::int FROM comment_likes cl
         WHERE cl.comment_id = ${comments.id})
        +
        (SELECT count(*)::int FROM comments r
         WHERE r.parent_id = ${comments.id})
      )`;
      orderBy = [desc(trendingScore), desc(comments.createdAt)];
    } else {
      orderBy = [desc(comments.createdAt)];
    }

    // Fetch limit + 1 to determine if there's a next page
    const rows = await db
      .select({
        id: comments.id,
        constellationId: comments.constellationId,
        userId: comments.userId,
        marketTicker: comments.marketTicker,
        parentId: comments.parentId,
        content: comments.content,
        positionDirection: comments.positionDirection,
        positionAmount: comments.positionAmount,
        taggedMarkets: comments.taggedMarkets,
        createdAt: comments.createdAt,
        userName: users.username,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
        constellationName: constellations.name,
        constellationSlug: constellations.slug,
        constellationTopic: constellations.topic,
        replyCount: replyCountSql,
        likeCount: likeCountSql,
        likedByMe: likedByMeSql,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(constellations, eq(comments.constellationId, constellations.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? pageRows[pageRows.length - 1].createdAt.toISOString()
      : null;

    const data: FeedItemResponse[] = pageRows.map((r) => ({
      id: r.id,
      constellationId: r.constellationId,
      userId: r.userId,
      marketTicker: r.marketTicker,
      parentId: r.parentId,
      content: r.content,
      positionDirection: r.positionDirection,
      positionAmount: r.positionAmount,
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
        topic: r.constellationTopic,
      },
      replyCount: r.replyCount ?? 0,
    }));

    return NextResponse.json({ data, nextCursor });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
