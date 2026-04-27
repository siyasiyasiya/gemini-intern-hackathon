import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import type { ApiResponse, CommentResponse } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const { searchParams } = new URL(request.url);
  const marketTicker = searchParams.get("marketTicker");
  const parentId = searchParams.get("parentId");

  try {
    const conditions = [eq(comments.roomId, roomId)];

    if (marketTicker) {
      conditions.push(eq(comments.marketTicker, marketTicker));
    }

    // If parentId is provided, fetch replies to that comment
    // Otherwise fetch top-level comments (no parent)
    if (parentId) {
      conditions.push(eq(comments.parentId, parentId));
    } else {
      conditions.push(isNull(comments.parentId));
    }

    const rows = await db
      .select({
        id: comments.id,
        roomId: comments.roomId,
        userId: comments.userId,
        marketTicker: comments.marketTicker,
        parentId: comments.parentId,
        content: comments.content,
        positionDirection: comments.positionDirection,
        positionAmount: comments.positionAmount,
        createdAt: comments.createdAt,
        userName: users.username,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt));

    // For top-level comments, also fetch first few replies
    const commentsWithReplies: CommentResponse[] = await Promise.all(
      rows.map(async (row) => {
        const replies = parentId
          ? []
          : await db
              .select({
                id: comments.id,
                roomId: comments.roomId,
                userId: comments.userId,
                marketTicker: comments.marketTicker,
                parentId: comments.parentId,
                content: comments.content,
                positionDirection: comments.positionDirection,
                positionAmount: comments.positionAmount,
                createdAt: comments.createdAt,
                userName: users.username,
                userDisplayName: users.displayName,
                userAvatarUrl: users.avatarUrl,
              })
              .from(comments)
              .innerJoin(users, eq(comments.userId, users.id))
              .where(eq(comments.parentId, row.id))
              .orderBy(comments.createdAt)
              .limit(3);

        return {
          id: row.id,
          roomId: row.roomId,
          userId: row.userId,
          marketTicker: row.marketTicker,
          parentId: row.parentId,
          content: row.content,
          positionDirection: row.positionDirection,
          positionAmount: row.positionAmount,
          createdAt: row.createdAt.toISOString(),
          user: {
            id: row.userId,
            username: row.userName,
            displayName: row.userDisplayName,
            avatarUrl: row.userAvatarUrl,
            bio: null,
            createdAt: "",
          },
          replies: replies.map((r) => ({
            id: r.id,
            roomId: r.roomId,
            userId: r.userId,
            marketTicker: r.marketTicker,
            parentId: r.parentId,
            content: r.content,
            positionDirection: r.positionDirection,
            positionAmount: r.positionAmount,
            createdAt: r.createdAt.toISOString(),
            user: {
              id: r.userId,
              username: r.userName,
              displayName: r.userDisplayName,
              avatarUrl: r.userAvatarUrl,
              bio: null,
              createdAt: "",
            },
          })),
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { content, marketTicker, parentId, positionDirection, positionAmount } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        roomId,
        userId: session.user.id,
        content: content.trim(),
        marketTicker: marketTicker || null,
        parentId: parentId || null,
        positionDirection: positionDirection || null,
        positionAmount: positionAmount != null ? Number(positionAmount) : null,
      })
      .returning();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const response: CommentResponse = {
      id: newComment.id,
      roomId: newComment.roomId,
      userId: newComment.userId,
      marketTicker: newComment.marketTicker,
      parentId: newComment.parentId,
      content: newComment.content,
      positionDirection: newComment.positionDirection,
      positionAmount: newComment.positionAmount,
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
