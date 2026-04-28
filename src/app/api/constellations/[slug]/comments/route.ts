import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { constellations, comments, users } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import type { ApiResponse, CommentResponse } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const marketTicker = searchParams.get("marketTicker");
  const parentId = searchParams.get("parentId");

  try {
    const [constellation] = await db
      .select({ id: constellations.id })
      .from(constellations)
      .where(eq(constellations.slug, slug))
      .limit(1);

    if (!constellation) {
      return NextResponse.json<ApiResponse<null>>({ error: "Constellation not found" }, { status: 404 });
    }

    const constellationId = constellation.id;
    const taggedMarket = searchParams.get("taggedMarket");

    const conditions = [eq(comments.constellationId, constellationId)];

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

    const rows = await db
      .select(commentSelect)
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt));

    function toCommentResponse(r: typeof rows[number]): CommentResponse {
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
        createdAt: r.createdAt.toISOString(),
        user: {
          id: r.userId,
          username: r.userName,
          displayName: r.userDisplayName,
          avatarUrl: r.userAvatarUrl,
          bio: null,
          createdAt: "",
        },
      };
    }

    const commentsWithReplies: CommentResponse[] = await Promise.all(
      rows.map(async (row) => {
        const replies = parentId
          ? []
          : await db
              .select(commentSelect)
              .from(comments)
              .innerJoin(users, eq(comments.userId, users.id))
              .where(eq(comments.parentId, row.id))
              .orderBy(comments.createdAt)
              .limit(3);

        return {
          ...toCommentResponse(row),
          replies: replies.map(toCommentResponse),
        };
      })
    );

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
