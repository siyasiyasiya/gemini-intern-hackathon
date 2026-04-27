import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse, UserResponse } from "@/types/api";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Support lookup by UUID or username
    const isUuid = UUID_REGEX.test(id);
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
      .where(isUuid ? eq(users.id, id) : eq(users.username, id))
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
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
