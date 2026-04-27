import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserGeminiCredentials, fetchOrderHistory } from "@/lib/market-data/gemini-authenticated";
import type { ApiResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.id !== id) {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const creds = await getUserGeminiCredentials(id);
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
