"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, ChevronUp, ChevronDown, ArrowRight, Info } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { AstronautAvatar } from "@/components/ui/AstronautAvatar";
import type { LeaderboardEntryResponse } from "@/types/api";

type SortField = "totalPnl" | "winRate" | "totalTrades";
type SortDir = "asc" | "desc";

const periods = [
  { value: "all_time", label: "All Time" },
  { value: "monthly", label: "This Month" },
  { value: "weekly", label: "This Week" },
];

const medalColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-700",
};

const medalBg: Record<number, string> = {
  1: "bg-yellow-500/10",
  2: "bg-gray-400/10",
  3: "bg-amber-700/10",
};

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState("all_time");
  const [sortField, setSortField] = useState<SortField>("totalPnl");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-full", period],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?limit=50&period=${period}`);
      return res.json();
    },
  });

  const entries: LeaderboardEntryResponse[] = data?.data || [];

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return copy.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, sortField, sortDir]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Check if the current user is in the list
  const currentUserId = session?.user?.id;
  const userEntry = currentUserId
    ? sorted.find((e) => e.userId === currentUserId)
    : null;
  const userInTop50 = !!userEntry;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />;
    return sortDir === "desc"
      ? <ChevronDown className="h-3 w-3" />
      : <ChevronUp className="h-3 w-3" />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 lg:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by prediction accuracy across all markets.
        </p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-8">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-1">No traders yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Join a constellation and start trading to climb the ranks.
          </p>
          <Link
            href="/constellations"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Explore Constellations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 spotlight */}
          {top3.length >= 3 && (
            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              {top3.map((entry) => (
                <Link
                  key={entry.userId}
                  href={`/profile/${entry.username}`}
                  className={cn(
                    "rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-border-hover hover:bg-card-hover",
                    currentUserId === entry.userId && "ring-1 ring-accent"
                  )}
                >
                  <div className={cn(
                    "inline-flex items-center justify-center h-8 w-8 rounded-full mb-3",
                    medalBg[entry.rank]
                  )}>
                    <Trophy className={cn("h-4 w-4", medalColors[entry.rank])} />
                  </div>
                  <div className="flex justify-center mb-2">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.username} className="h-12 w-12 rounded-full" />
                    ) : (
                      <AstronautAvatar seed={entry.username} size={48} className="rounded-full" />
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate">
                    {entry.displayName || entry.username}
                  </p>
                  <p className={cn(
                    "text-lg font-bold mt-1",
                    entry.totalPnl >= 0 ? "text-yes-text" : "text-no-text"
                  )}>
                    {entry.totalPnl >= 0 ? "+" : ""}{formatCurrency(entry.totalPnl)}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{Math.round(entry.winRate * 100)}% WR</span>
                    <span>{entry.totalTrades} trades</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[3rem_1fr_8rem_8rem_8rem] items-center gap-2 px-4 py-3 border-b border-border bg-secondary text-xs font-medium text-muted-foreground">
              <span>#</span>
              <span>Trader</span>
              <button
                onClick={() => toggleSort("winRate")}
                className="group flex items-center gap-1 justify-end hover:text-foreground transition-colors"
              >
                Win Rate <SortIcon field="winRate" />
              </button>
              <button
                onClick={() => toggleSort("totalTrades")}
                className="group flex items-center gap-1 justify-end hover:text-foreground transition-colors"
              >
                Trades <SortIcon field="totalTrades" />
              </button>
              <button
                onClick={() => toggleSort("totalPnl")}
                className="group flex items-center gap-1 justify-end hover:text-foreground transition-colors"
              >
                P&L <SortIcon field="totalPnl" />
              </button>
            </div>

            {/* Rows */}
            {(top3.length < 3 ? sorted : rest).map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={currentUserId === entry.userId}
              />
            ))}

            {/* Pinned current user row if not in top 50 */}
            {currentUserId && !userInTop50 && (
              <div className="border-t-2 border-accent/30">
                <div className="px-4 py-2 text-xs text-muted-foreground bg-accent-bg">
                  Your ranking
                </div>
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  Trade in a constellation to appear on the leaderboard.
                </div>
              </div>
            )}
          </div>

          {/* Explainer */}
          <div className="flex items-start gap-2 mt-6 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Rankings are based on trades made within constellations. P&L reflects your prediction accuracy across resolved markets.
            </p>
          </div>
        </>
      )}
    </main>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntryResponse;
  isCurrentUser: boolean;
}) {
  const isTop3 = entry.rank <= 3;
  const winPercent = Math.round(entry.winRate * 100);

  return (
    <Link
      href={`/profile/${entry.username}`}
      className={cn(
        "grid grid-cols-[3rem_1fr_8rem_8rem_8rem] items-center gap-2 px-4 py-3 transition-colors hover:bg-secondary",
        isCurrentUser && "bg-accent-bg hover:bg-accent-bg-hover"
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        {isTop3 ? (
          <Trophy className={cn("h-4 w-4", medalColors[entry.rank])} />
        ) : (
          <span className="text-sm text-muted-foreground">{entry.rank}</span>
        )}
      </div>

      {/* Trader */}
      <div className="flex items-center gap-3 min-w-0">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.username} className="h-8 w-8 rounded-full shrink-0" />
        ) : (
          <AstronautAvatar seed={entry.username} size={32} className="rounded-full shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {entry.displayName || entry.username}
            {isCurrentUser && <span className="ml-1.5 text-xs text-accent font-normal">(you)</span>}
          </p>
        </div>
      </div>

      {/* Win Rate */}
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${winPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium">{winPercent}%</span>
        </div>
      </div>

      {/* Trades */}
      <div className="text-right">
        <span className="text-sm text-muted-foreground">{entry.totalTrades}</span>
      </div>

      {/* P&L */}
      <div className="text-right">
        <span className={cn(
          "text-sm font-semibold",
          entry.totalPnl >= 0 ? "text-yes-text" : "text-no-text"
        )}>
          {entry.totalPnl >= 0 ? "+" : ""}{formatCurrency(entry.totalPnl)}
        </span>
      </div>
    </Link>
  );
}
