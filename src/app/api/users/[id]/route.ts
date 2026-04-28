import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function PATCH(
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

  const { id } = await params;

  // Only allow editing your own profile (by UUID or username)
  const isUuid = UUID_REGEX.test(id);
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(isUuid ? eq(users.id, id) : eq(users.username, id))
    .limit(1);

  if (!target || target.id !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { displayName, bio, avatarUrl } = body;

    const updates: Record<string, string | null> = {};
    if (typeof displayName === "string") updates.displayName = displayName.trim() || null;
    if (typeof bio === "string") updates.bio = bio.trim() || null;
    if (typeof avatarUrl === "string") updates.avatarUrl = avatarUrl.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt,
      });

    const response: UserResponse = {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<UserResponse>>({ data: response });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
