"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { MemberList } from "@/components/rooms/MemberList";
import { MarketFeed } from "@/components/markets/MarketFeed";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { CommentThread } from "@/components/comments/CommentThread";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { useSocket } from "@/hooks/useSocket";
import type { RoomResponse } from "@/types/api";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  useSocket(id);

  const { data: roomData, isLoading: roomLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${id}`);
      return res.json();
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ["room-members", id],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${id}/members`);
      return res.json();
    },
  });

  const room: RoomResponse | undefined = roomData?.data;
  const members = membersData?.data || [];
  const currentMember = session
    ? members.find((m: any) => m.userId === session.user.id)
    : null;

  function handleMembershipChange() {
    queryClient.invalidateQueries({ queryKey: ["room", id] });
    queryClient.invalidateQueries({ queryKey: ["room-members", id] });
  }

  if (roomLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <RoomHeader
        room={room}
        isMember={!!currentMember}
        userRole={currentMember?.role}
        onMembershipChange={handleMembershipChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: market feed */}
        <aside className="hidden lg:block w-80 border-r border-border overflow-y-auto">
          <div className="p-4">
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
          <CommentThread roomId={id} marketTicker={selectedMarket ?? undefined} />
        </main>

        {/* Right sidebar: leaderboard + members */}
        <aside className="hidden md:block w-72 border-l border-border overflow-y-auto">
          <div className="p-4 space-y-6">
            <Leaderboard roomId={id} />
            <MemberList roomId={id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
