"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomResponse } from "@/types/api";

const topicColors: Record<string, string> = {
  politics: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  sports: "bg-green-500/20 text-green-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  science: "bg-cyan-500/20 text-cyan-400",
  economics: "bg-yellow-500/20 text-yellow-400",
  technology: "bg-purple-500/20 text-purple-400",
  other: "bg-zinc-500/20 text-zinc-400",
};

export function RoomCard({ room }: { room: RoomResponse }) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
            {room.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              topicColors[room.topic] || topicColors.other
            )}
          >
            {room.topic}
          </span>
        </div>
        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {room.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{room.memberCount} {room.memberCount === 1 ? "member" : "members"}</span>
        </div>
      </div>
    </Link>
  );
}
