import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations, comments, users, commentLikes } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
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
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
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

    const rows = await db
      .select(commentSelect)
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt));

    const allReplyRows = new Map<string, (typeof rows)>();
    const allCommentIds = rows.map((r) => r.id);

    if (!parentId) {
      for (const row of rows) {
        const replies = await db
          .select(commentSelect)
          .from(comments)
          .innerJoin(users, eq(comments.userId, users.id))
          .where(eq(comments.parentId, row.id))
          .orderBy(comments.createdAt)
          .limit(3);

        allReplyRows.set(row.id, replies);
        for (const r of replies) allCommentIds.push(r.id);
      }
    }

    const likeMap = await getLikesForComments(allCommentIds, currentUserId);

    const commentsWithReplies: CommentResponse[] = rows.map((row) => {
      const replyRows = allReplyRows.get(row.id) || [];
      const replies = replyRows.map((r) => toCommentResponse(r, likeMap));
      return toCommentResponse(row, likeMap, replies);
    });

    return NextResponse.json<ApiResponse<CommentResponse[]>>({
      data: commentsWithReplies,
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
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, marketTicker, parentId, positionDirection, positionAmount, taggedMarkets } = body;

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
        taggedMarkets: taggedMarketsArr,
      })
      .returning();

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
