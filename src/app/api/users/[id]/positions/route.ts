import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserGeminiCredentials, fetchPositions, fetchSettledPositions } from "@/lib/market-data/gemini-authenticated";
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
      return NextResponse.json({ data: { active: [], settled: [] } });
    }

    const [active, settled] = await Promise.all([
      fetchPositions(creds.apiKey, creds.apiSecret).catch(() => []),
      fetchSettledPositions(creds.apiKey, creds.apiSecret).catch(() => []),
    ]);

    return NextResponse.json({ data: { active, settled } });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
