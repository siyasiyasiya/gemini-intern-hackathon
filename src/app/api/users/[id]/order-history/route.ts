import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserGeminiCredentials, fetchOrderHistory } from "@/lib/market-data/gemini-authenticated";
import { resolveUser } from "@/lib/db/resolve-user";
import type { ApiResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idOrUsername } = await params;
  const session = await auth();
  const user = await resolveUser(idOrUsername);

  if (!user || !session?.user?.id || session.user.id !== user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const creds = await getUserGeminiCredentials(user.id);
    if (!creds) {
      return NextResponse.json({ data: [] });
    }

    const orders = await fetchOrderHistory(creds.apiKey, creds.apiSecret).catch(() => []);
    return NextResponse.json({ data: orders });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch order history" },
      { status: 500 }
    );
  }
}
