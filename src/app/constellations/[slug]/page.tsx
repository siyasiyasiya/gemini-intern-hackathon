"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ConstellationHeader } from "@/components/constellations/ConstellationHeader";
import { MemberList } from "@/components/constellations/MemberList";
import { ConstellationAbout } from "@/components/constellations/ConstellationAbout";
import { ConstellationRules } from "@/components/constellations/ConstellationRules";
import { ConstellationStats } from "@/components/constellations/ConstellationStats";
import { TrackedMarkets } from "@/components/constellations/TrackedMarkets";
import { MarketFeed } from "@/components/markets/MarketFeed";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { CommentThread } from "@/components/comments/CommentThread";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useSocket } from "@/hooks/useSocket";
import type { ConstellationResponse } from "@/types/api";

export default function ConstellationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const { data: constellationData, isLoading: constellationLoading } = useQuery({
    queryKey: ["constellation", slug],
    queryFn: async () => {
      const res = await fetch(`/api/constellations/${slug}`);
      return res.json();
    },
  });

  const constellation: ConstellationResponse | undefined = constellationData?.data;

  const { data: membersData } = useQuery({
    queryKey: ["constellation-members", slug],
    queryFn: async () => {
      const res = await fetch(`/api/constellations/${slug}/members`);
      return res.json();
    },
  });

  useSocket(constellation?.id);

  const members = membersData?.data || [];
  const currentMember = session
    ? members.find((m: any) => m.userId === session.user.id)
    : null;
  const canManage = currentMember?.role === "owner" || currentMember?.role === "moderator";

  function handleMembershipChange() {
    queryClient.invalidateQueries({ queryKey: ["constellation", slug] });
    queryClient.invalidateQueries({ queryKey: ["constellation-members", slug] });
  }

  if (constellationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!constellation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Constellation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ConstellationHeader
        constellation={constellation}
        isMember={!!currentMember}
        userRole={currentMember?.role}
        onMembershipChange={handleMembershipChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: tracked markets + market feed */}
        <aside className="hidden lg:block w-80 border-r border-border overflow-y-auto">
          <div className="p-4">
            <TrackedMarkets
              constellationSlug={slug}
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
              <MarketFeed onSelectMarket={(ticker) => setSelectedMarket(ticker)} constellationSlug={slug} />
            )}
          </div>
        </aside>

        {/* Center: comments / discussion */}
        <main className="flex-1 overflow-y-auto p-4">
          <CommentThread
            constellationSlug={slug}
            marketTicker={selectedMarket ?? undefined}
            onSelectMarket={(ticker) => setSelectedMarket(ticker)}
          />
        </main>

        {/* Right sidebar: about, rules, stats, leaderboard, members */}
        <aside className="hidden md:block w-80 lg:w-[22rem] border-l border-border overflow-y-auto">
          <div className="p-4 space-y-6">
            <ConstellationAbout constellation={constellation} />
            <ConstellationRules constellation={constellation} />
            <ConstellationStats constellationSlug={slug} />
            <Leaderboard constellationId={constellation.id} />
            <MemberList constellationSlug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
