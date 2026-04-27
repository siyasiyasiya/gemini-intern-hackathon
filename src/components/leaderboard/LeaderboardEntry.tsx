"use client";

import { Trophy } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { LeaderboardEntryResponse } from "@/types/api";
import Link from "next/link";

interface LeaderboardEntryProps {
  entry: LeaderboardEntryResponse;
}

const medalColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-amber-600",
};

export function LeaderboardEntry({ entry }: LeaderboardEntryProps) {
  const isTop3 = entry.rank <= 3;
  const initials = (entry.displayName || entry.username).slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/profile/${entry.userId}`}
      className={cn(
        "flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-zinc-800",
        isTop3 && "bg-zinc-800/50"
      )}
    >
      <div className="flex w-8 items-center justify-center">
        {isTop3 ? (
          <Trophy className={cn("h-5 w-5", medalColors[entry.rank])} />
        ) : (
          <span className="text-sm font-medium text-zinc-500">{entry.rank}</span>
        )}
      </div>

      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.username}
          className="h-9 w-9 rounded-full"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-zinc-300">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">
          {entry.displayName || entry.username}
        </p>
        <p className="text-xs text-zinc-500">@{entry.username}</p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold",
            entry.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
          )}
        >
          {entry.totalPnl >= 0 ? "+" : ""}
          {formatCurrency(entry.totalPnl)}
        </p>
        <p className="text-xs text-zinc-500">
          {Math.round(entry.winRate * 100)}% WR &middot; {entry.totalTrades} trades
        </p>
      </div>
    </Link>
  );
}
