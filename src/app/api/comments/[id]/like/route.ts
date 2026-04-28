import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commentLikes, comments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  try {
    const [comment] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      return NextResponse.json<ApiResponse<null>>({ error: "Comment not found" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.user.id)))
      .limit(1);

    if (existing) {
      // Unlike
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.user.id)));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(commentLikes)
        .where(eq(commentLikes.commentId, commentId));

      return NextResponse.json({ data: { liked: false, likeCount: count } });
    }

    // Like
    await db.insert(commentLikes).values({
      commentId,
      userId: session.user.id,
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(commentLikes)
      .where(eq(commentLikes.commentId, commentId));

    return NextResponse.json({ data: { liked: true, likeCount: count } });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to toggle like" }, { status: 500 });
  }
}
