import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations, constellationMembers, comments, users, commentLikes, trackedMarkets } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { checkConstellationAccess } from "@/lib/db/check-membership";
import type { ApiResponse, CommentResponse } from "@/types/api";

const commentSelect = {
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
};

async function getLikesForComments(commentIds: string[], currentUserId?: string) {
  if (commentIds.length === 0) return new Map<string, { count: number; likedByMe: boolean }>();

  const counts = await db
    .select({
      commentId: commentLikes.commentId,
      count: sql<number>`count(*)::int`,
    })
    .from(commentLikes)
    .where(sql`${commentLikes.commentId} in ${commentIds}`)
    .groupBy(commentLikes.commentId);

  const likeMap = new Map<string, { count: number; likedByMe: boolean }>();
  for (const c of counts) {
    likeMap.set(c.commentId, { count: c.count, likedByMe: false });
  }

  if (currentUserId) {
    const myLikes = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(and(
        sql`${commentLikes.commentId} in ${commentIds}`,
        eq(commentLikes.userId, currentUserId)
      ));

    for (const l of myLikes) {
      const entry = likeMap.get(l.commentId);
      if (entry) entry.likedByMe = true;
      else likeMap.set(l.commentId, { count: 0, likedByMe: true });
    }
  }

  return likeMap;
}

function toCommentResponse(
  r: any,
  likeMap: Map<string, { count: number; likedByMe: boolean }>,
  replies: CommentResponse[] = []
): CommentResponse {
  const likes = likeMap.get(r.id) || { count: 0, likedByMe: false };
  return {
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
    likeCount: likes.count,
    likedByMe: likes.likedByMe,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    user: {
      id: r.userId,
      username: r.userName,
      displayName: r.userDisplayName,
      avatarUrl: r.userAvatarUrl,
      bio: null,
      createdAt: "",
    },
    replies,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const marketTicker = searchParams.get("marketTicker");
  const parentId = searchParams.get("parentId");
  const taggedMarket = searchParams.get("taggedMarket");

  const session = await auth();
  const currentUserId = session?.user?.id;

  try {
    const { constellation, forbidden } = await checkConstellationAccess(slug, currentUserId);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    if (forbidden) {
      return NextResponse.json<ApiResponse<null>>({ error: "This constellation is private" }, { status: 403 });
    }

    const conditions = [eq(comments.constellationId, constellation.id)];

    if (marketTicker) {
      conditions.push(eq(comments.marketTicker, marketTicker));
    }

    if (taggedMarket) {
      conditions.push(sql`${taggedMarket} = ANY(${comments.taggedMarkets})`);
    }

    if (parentId) {
      conditions.push(eq(comments.parentId, parentId));
    } else {
      conditions.push(isNull(comments.parentId));
    }

    // For top-level queries, include reply count subquery
    const replyCountSql = !parentId
      ? sql<number>`(SELECT count(*)::int FROM comments r WHERE r.parent_id = ${comments.id})`.as("reply_count")
      : sql<number>`0`.as("reply_count");

    const rows = await db
      .select({
        ...commentSelect,
        replyCount: replyCountSql,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(parentId ? comments.createdAt : desc(comments.createdAt));

    const allCommentIds = rows.map((r) => r.id);
    const likeMap = await getLikesForComments(allCommentIds, currentUserId);

    const result: CommentResponse[] = rows.map((row) => ({
      ...toCommentResponse(row, likeMap),
      replyCount: (row as any).replyCount ?? 0,
    }));

    return NextResponse.json<ApiResponse<CommentResponse[]>>({
      data: result,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { slug } = await params;

  try {
    const { constellation, isMember } = await checkConstellationAccess(slug, session.user.id);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    if (!isMember) {
      return NextResponse.json<ApiResponse<null>>({ error: "Must be a member to comment" }, { status: 403 });
    }

    const body = await request.json();
    const { content, marketTicker, parentId, positionDirection, positionAmount, positionContractLabel, taggedMarkets } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const taggedMarketsArr = Array.isArray(taggedMarkets) && taggedMarkets.length > 0
      ? taggedMarkets.filter((t: unknown) => typeof t === "string")
      : null;

    const [newComment] = await db
      .insert(comments)
      .values({
        constellationId: constellation.id,
        userId: session.user.id,
        content: content.trim(),
        marketTicker: marketTicker || null,
        parentId: parentId || null,
        positionDirection: positionDirection || null,
        positionAmount: positionAmount != null ? Number(positionAmount) : null,
        positionContractLabel: positionContractLabel || null,
        taggedMarkets: taggedMarketsArr,
      })
      .returning();

    // Upsert tagged tickers into tracked_markets (auto-grow watchlist)
    if (taggedMarketsArr && taggedMarketsArr.length > 0) {
      await Promise.all(
        taggedMarketsArr.map((ticker: string) =>
          db
            .insert(trackedMarkets)
            .values({
              constellationId: constellation.id,
              marketTicker: ticker,
              pinnedBy: session.user.id,
            })
            .onConflictDoNothing({ target: [trackedMarkets.constellationId, trackedMarkets.marketTicker] })
        )
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const response: CommentResponse = {
      id: newComment.id,
      constellationId: newComment.constellationId,
      userId: newComment.userId,
      marketTicker: newComment.marketTicker,
      parentId: newComment.parentId,
      content: newComment.content,
      positionDirection: newComment.positionDirection,
      positionAmount: newComment.positionAmount,
      positionContractLabel: newComment.positionContractLabel,
      taggedMarkets: newComment.taggedMarkets,
      likeCount: 0,
      likedByMe: false,
      createdAt: newComment.createdAt.toISOString(),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      replies: [],
    };

    return NextResponse.json<ApiResponse<CommentResponse>>({ data: response }, { status: 201 });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
