import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { fetchPositions } from "@/lib/market-data/gemini-authenticated";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const [user] = await db
    .select({ geminiApiKeyEnc: users.geminiApiKeyEnc })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({ data: { connected: !!user?.geminiApiKeyEnc } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { apiKey, apiSecret } = body as { apiKey?: string; apiSecret?: string };

  if (!apiKey || !apiSecret) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "API key and secret are required" },
      { status: 400 }
    );
  }

  // Validate by making a test call
  try {
    await fetchPositions(apiKey, apiSecret);
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Invalid Gemini API credentials. Please check your key and secret." },
      { status: 400 }
    );
  }

  // Encrypt and store
  await db
    .update(users)
    .set({
      geminiApiKeyEnc: encrypt(apiKey),
      geminiApiSecretEnc: encrypt(apiSecret),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ data: { connected: true } });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  await db
    .update(users)
    .set({
      geminiApiKeyEnc: null,
      geminiApiSecretEnc: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ data: { connected: false } });
}
