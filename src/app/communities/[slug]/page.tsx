"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityHeader } from "@/components/communities/CommunityHeader";
import { MemberList } from "@/components/communities/MemberList";
import { CommunityAbout } from "@/components/communities/CommunityAbout";
import { CommunityRules } from "@/components/communities/CommunityRules";
import { CommunityStats } from "@/components/communities/CommunityStats";
import { TrackedMarkets } from "@/components/communities/TrackedMarkets";
import { MarketFeed } from "@/components/markets/MarketFeed";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { CommentThread } from "@/components/comments/CommentThread";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useSocket } from "@/hooks/useSocket";
import type { CommunityResponse } from "@/types/api";

type MobileTab = "discussion" | "markets" | "about";

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("discussion");

  const { data: communityData, isLoading: communityLoading } = useQuery({
    queryKey: ["community", slug],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${slug}`);
      return res.json();
    },
  });

  const community: CommunityResponse | undefined = communityData?.data;

  const { data: membersData } = useQuery({
    queryKey: ["community-members", slug],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${slug}/members`);
      return res.json();
    },
  });

  useSocket(community?.id);

  const members = membersData?.data || [];
  const currentMember = session
    ? members.find((m: any) => m.userId === session.user.id)
    : null;
  const canManage = currentMember?.role === "owner" || currentMember?.role === "moderator";

  function handleMembershipChange() {
    queryClient.invalidateQueries({ queryKey: ["community", slug] });
    queryClient.invalidateQueries({ queryKey: ["community-members", slug] });
  }

  if (communityLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  const MOBILE_TABS: { key: MobileTab; label: string }[] = [
    { key: "discussion", label: "Discussion" },
    { key: "markets", label: "Markets" },
    { key: "about", label: "About" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CommunityHeader
        community={community}
        isMember={!!currentMember}
        userRole={currentMember?.role}
        onMembershipChange={handleMembershipChange}
      />

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-border bg-card">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium text-center transition-colors",
              mobileTab === tab.key
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile content */}
      <div className="md:hidden flex-1 overflow-y-auto p-4">
        {mobileTab === "discussion" && (
          <CommentThread communitySlug={slug} marketTicker={selectedMarket ?? undefined} />
        )}
        {mobileTab === "markets" && (
          <>
            <TrackedMarkets
              communitySlug={slug}
              canManage={canManage}
              onSelectMarket={(ticker) => setSelectedMarket(ticker)}
            />
            {selectedMarket ? (
              <MarketDetail
                ticker={selectedMarket}
                onBack={() => setSelectedMarket(null)}
                onSelectRelated={(ticker) => setSelectedMarket(ticker)}
              />
            ) : (
              <MarketFeed onSelectMarket={(ticker) => setSelectedMarket(ticker)} />
            )}
          </>
        )}
        {mobileTab === "about" && (
          <div className="space-y-6">
            <CommunityAbout community={community} />
            <CommunityRules community={community} />
            <CommunityStats communitySlug={slug} />
            <Leaderboard communityId={community.id} />
            <MemberList communitySlug={slug} />
          </div>
        )}
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left sidebar: tracked markets + market feed */}
        <aside className="hidden lg:block w-80 border-r border-border overflow-y-auto">
          <div className="p-4">
            <TrackedMarkets
              communitySlug={slug}
              canManage={canManage}
              onSelectMarket={(ticker) => setSelectedMarket(ticker)}
            />
            {selectedMarket ? (
              <MarketDetail
                ticker={selectedMarket}
                onBack={() => setSelectedMarket(null)}
                onSelectRelated={(ticker) => setSelectedMarket(ticker)}
              />
            ) : (
              <MarketFeed onSelectMarket={(ticker) => setSelectedMarket(ticker)} />
            )}
          </div>
        </aside>

        {/* Center: comments / discussion */}
        <main className="flex-1 overflow-y-auto p-4">
          <CommentThread communitySlug={slug} marketTicker={selectedMarket ?? undefined} />
        </main>

        {/* Right sidebar: about, rules, stats, leaderboard, members */}
        <aside className="w-72 border-l border-border overflow-y-auto">
          <div className="p-4 space-y-6">
            <CommunityAbout community={community} />
            <CommunityRules community={community} />
            <CommunityStats communitySlug={slug} />
            <Leaderboard communityId={community.id} />
            <MemberList communitySlug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
