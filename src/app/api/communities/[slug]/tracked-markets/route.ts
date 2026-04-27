import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers, trackedMarkets } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import type { ApiResponse, TrackedMarketResponse } from "@/types/api";

async function getCommunityBySlug(slug: string) {
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1);
  return community;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const community = await getCommunityBySlug(slug);
    if (!community) {
      return NextResponse.json<ApiResponse<null>>({ error: "Community not found" }, { status: 404 });
    }

    const markets = await db
      .select()
      .from(trackedMarkets)
      .where(eq(trackedMarkets.communityId, community.id))
      .orderBy(desc(trackedMarkets.pinnedAt));

    const data: TrackedMarketResponse[] = markets.map((m) => ({
      id: m.id,
      communityId: m.communityId,
      marketTicker: m.marketTicker,
      pinnedAt: m.pinnedAt.toISOString(),
      pinnedBy: m.pinnedBy,
    }));

    return NextResponse.json<ApiResponse<TrackedMarketResponse[]>>({ data });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to fetch tracked markets" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const community = await getCommunityBySlug(slug);
    if (!community) {
      return NextResponse.json<ApiResponse<null>>({ error: "Community not found" }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, session.user.id)))
      .limit(1);

    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      return NextResponse.json<ApiResponse<null>>({ error: "Only owners and moderators can pin markets" }, { status: 403 });
    }

    const body = await request.json();
    const { marketTicker } = body;

    if (!marketTicker) {
      return NextResponse.json<ApiResponse<null>>({ error: "Market ticker is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(trackedMarkets)
      .where(and(eq(trackedMarkets.communityId, community.id), eq(trackedMarkets.marketTicker, marketTicker)))
      .limit(1);

    if (existing) {
      return NextResponse.json<ApiResponse<null>>({ error: "Market already tracked" }, { status: 400 });
    }

    const [tracked] = await db
      .insert(trackedMarkets)
      .values({
        communityId: community.id,
        marketTicker,
        pinnedBy: session.user.id,
      })
      .returning();

    const data: TrackedMarketResponse = {
      id: tracked.id,
      communityId: tracked.communityId,
      marketTicker: tracked.marketTicker,
      pinnedAt: tracked.pinnedAt.toISOString(),
      pinnedBy: tracked.pinnedBy,
    };

    return NextResponse.json<ApiResponse<TrackedMarketResponse>>({ data }, { status: 201 });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to pin market" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const community = await getCommunityBySlug(slug);
    if (!community) {
      return NextResponse.json<ApiResponse<null>>({ error: "Community not found" }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, community.id), eq(communityMembers.userId, session.user.id)))
      .limit(1);

    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      return NextResponse.json<ApiResponse<null>>({ error: "Only owners and moderators can unpin markets" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const marketTicker = searchParams.get("marketTicker");

    if (!marketTicker) {
      return NextResponse.json<ApiResponse<null>>({ error: "Market ticker is required" }, { status: 400 });
    }

    await db
      .delete(trackedMarkets)
      .where(and(eq(trackedMarkets.communityId, community.id), eq(trackedMarkets.marketTicker, marketTicker)));

    return NextResponse.json<ApiResponse<{ unpinned: boolean }>>({ data: { unpinned: true } });
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: "Failed to unpin market" }, { status: 500 });
  }
}
