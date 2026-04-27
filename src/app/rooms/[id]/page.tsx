"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { RoomHeader } from "@/components/rooms/RoomHeader";
import { MemberList } from "@/components/rooms/MemberList";
import type { RoomResponse } from "@/types/api";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

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
        {/* Left sidebar: market feed placeholder */}
        <aside className="hidden lg:block w-72 border-r border-border p-4 overflow-y-auto">
          <div
            id="market-feed"
            className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
          >
            Market feed
          </div>
        </aside>

        {/* Center: comments placeholder */}
        <main className="flex-1 overflow-y-auto p-4">
          <div
            id="comments"
            className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
          >
            Discussion area
          </div>
        </main>

        {/* Right sidebar: members + watchlist */}
        <aside className="hidden md:block w-64 border-l border-border p-4 overflow-y-auto">
          <MemberList roomId={id} />
          <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Watchlist
          </div>
        </aside>
      </div>
    </div>
  );
}
