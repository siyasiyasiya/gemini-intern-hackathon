import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, commentLikes, users, constellations } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, desc, lt, sql } from "drizzle-orm";
import { resolveUser } from "@/lib/db/resolve-user";
import type { ApiResponse } from "@/types/api";

type Tab = "posts" | "replies" | "likes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tab = (searchParams.get("tab") || "posts") as Tab;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  // Get current user for likedByMe
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  try {
    const user = await resolveUser(id);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const replyCountSql = sql<number>`(
      SELECT count(*)::int FROM comments r WHERE r.parent_id = ${comments.id}
    )`.as("reply_count");

    const likeCountSql = sql<number>`(
      SELECT count(*)::int FROM comment_likes cl WHERE cl.comment_id = ${comments.id}
    )`.as("like_count");

    const likedByMeSql = currentUserId
      ? sql<boolean>`EXISTS(
          SELECT 1 FROM comment_likes cl
          WHERE cl.comment_id = ${comments.id} AND cl.user_id = ${currentUserId}
        )`.as("liked_by_me")
      : sql<boolean>`false`.as("liked_by_me");

    if (tab === "likes") {
      const conditions = [eq(commentLikes.userId, user.id)];
      if (cursor) {
        conditions.push(lt(commentLikes.createdAt, new Date(cursor)));
      }

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
          constellationCategories: constellations.categories,
          replyCount: replyCountSql,
          likeCount: likeCountSql,
          likedByMe: likedByMeSql,
          likedAt: commentLikes.createdAt,
        })
        .from(commentLikes)
        .innerJoin(comments, eq(commentLikes.commentId, comments.id))
        .innerJoin(users, eq(comments.userId, users.id))
        .innerJoin(constellations, eq(comments.constellationId, constellations.id))
        .where(and(...conditions))
        .orderBy(desc(commentLikes.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore
        ? pageRows[pageRows.length - 1].likedAt.toISOString()
        : null;

      const data = pageRows.map((r) => ({
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
          topic: (r.constellationCategories as string[])?.[0] ?? "other",
        },
        replyCount: r.replyCount ?? 0,
      }));

      return NextResponse.json({ data, nextCursor });
    }

    // Posts or Replies tab
    const isReplies = tab === "replies";
    const conditions = [
      eq(comments.userId, user.id),
      isReplies ? isNotNull(comments.parentId) : isNull(comments.parentId),
    ];
    if (cursor) {
      conditions.push(lt(comments.createdAt, new Date(cursor)));
    }

    const baseSelect = {
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
      constellationCategories: constellations.categories,
      replyCount: replyCountSql,
      likeCount: likeCountSql,
      likedByMe: likedByMeSql,
      ...(isReplies
        ? {
            parentContent: sql<string>`(
              SELECT content FROM comments pc WHERE pc.id = ${comments.parentId}
            )`.as("parent_content"),
            parentUsername: sql<string>`(
              SELECT u.username FROM comments pc
              JOIN users u ON u.id = pc.user_id
              WHERE pc.id = ${comments.parentId}
            )`.as("parent_username"),
          }
        : {}),
    };

    const rows = await db
      .select(baseSelect)
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(constellations, eq(comments.constellationId, constellations.id))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? pageRows[pageRows.length - 1].createdAt.toISOString()
      : null;

    const data = pageRows.map((r: any) => ({
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
        topic: (r.constellationCategories as string[])?.[0] ?? "other",
      },
      replyCount: r.replyCount ?? 0,
      ...(isReplies && r.parentContent
        ? {
            parentComment: {
              username: r.parentUsername ?? "unknown",
              content:
                r.parentContent.length > 100
                  ? r.parentContent.slice(0, 100) + "..."
                  : r.parentContent,
            },
          }
        : {}),
    }));

    return NextResponse.json({ data, nextCursor });
  } catch (e) {
    console.error("Activity API error:", e);
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
