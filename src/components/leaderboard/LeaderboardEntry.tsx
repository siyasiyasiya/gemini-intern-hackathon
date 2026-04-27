"use client";

import { Trophy } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { LeaderboardEntryResponse } from "@/types/api";
import Link from "next/link";

interface LeaderboardEntryProps {
  entry: LeaderboardEntryResponse;
}

const medalColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-700",
};

export function LeaderboardEntry({ entry }: LeaderboardEntryProps) {
  const isTop3 = entry.rank <= 3;
  const initials = (entry.displayName || entry.username).slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/profile/${entry.userId}`}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary",
        isTop3 && "bg-secondary"
      )}
    >
      {/* Rank */}
      <div className="flex w-6 shrink-0 items-center justify-center">
        {isTop3 ? (
          <Trophy className={cn("h-4 w-4", medalColors[entry.rank])} />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.username}
          className="h-8 w-8 shrink-0 rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>
      )}

      {/* Name + stats */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground leading-tight">
          {entry.displayName || entry.username}
        </p>
        <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
          {Math.round(entry.winRate * 100)}% WR &middot; {entry.totalTrades} trades
        </p>
      </div>

      {/* P&L — right-aligned */}
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            entry.totalPnl >= 0 ? "text-yes-text" : "text-no-text"
          )}
        >
          {entry.totalPnl >= 0 ? "+" : ""}
          {formatCurrency(entry.totalPnl)}
        </p>
      </div>
    </Link>
  );
}
