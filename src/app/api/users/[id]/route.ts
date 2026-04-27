import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse, UserResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const response: UserResponse = {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<UserResponse>>({ data: response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch user";
    // Invalid UUID format from Postgres will throw here
    if (message.includes("invalid input syntax")) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
