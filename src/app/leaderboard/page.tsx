"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Trophy,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Info,
  Users,
} from "lucide-react";
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils";
import { AstronautAvatar } from "@/components/ui/AstronautAvatar";
import type { LeaderboardEntryResponse } from "@/types/api";
import type { ConstellationLeaderboardEntry } from "@/app/api/leaderboard/constellations/route";

type SortField = "totalPnl" | "winRate" | "totalTrades";
type SortDir = "asc" | "desc";
type ConstellationSortField = "totalVolume" | "totalTrades" | "memberCount" | "collectiveAccuracy";

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

const categoryColors: Record<string, string> = {
  politics: "bg-blue-500/10 text-blue-600",
  crypto: "bg-orange-500/10 text-orange-600",
  sports: "bg-green-500/10 text-green-600",
  entertainment: "bg-pink-500/10 text-pink-600",
  science: "bg-cyan-500/10 text-cyan-600",
  economics: "bg-yellow-500/10 text-yellow-600",
  technology: "bg-purple-500/10 text-purple-600",
  commodities: "bg-amber-500/10 text-amber-600",
  business: "bg-slate-500/10 text-slate-600",
  weather: "bg-sky-500/10 text-sky-600",
  media: "bg-rose-500/10 text-rose-600",
  culture: "bg-violet-500/10 text-violet-600",
  other: "bg-gray-500/10 text-gray-600",
};

export default function LeaderboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by prediction accuracy across all markets.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <TradersPanel />
        <ConstellationsPanel />
      </div>

      {/* Explainer */}
      <div className="flex items-start gap-2 mt-8 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>
          Rankings are based on trades made within constellations. P&L reflects your prediction accuracy across resolved markets.
        </p>
      </div>
    </main>
  );
}

// ============================================================
// Left panel: Traders leaderboard
// ============================================================

function TradersPanel() {
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

  const currentUserId = session?.user?.id;
  const userInTop50 = currentUserId ? sorted.some((e) => e.userId === currentUserId) : false;

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-4.5 w-4.5 text-accent" />
          Traders
        </h2>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-6">
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
            <div className="grid gap-3 sm:grid-cols-3 mb-6">
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
            <div className="grid grid-cols-[2.5rem_1fr_5.5rem_5rem_6rem] items-center gap-2 px-4 py-3 border-b border-border bg-secondary text-xs font-medium text-muted-foreground">
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

            {(top3.length < 3 ? sorted : rest).map((entry) => (
              <TraderRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={currentUserId === entry.userId}
              />
            ))}

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
        </>
      )}
    </div>
  );
}

function TraderRow({
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
        "grid grid-cols-[2.5rem_1fr_5.5rem_5rem_6rem] items-center gap-2 px-4 py-3 transition-colors hover:bg-secondary",
        isCurrentUser && "bg-accent-bg hover:bg-accent-bg-hover"
      )}
    >
      <div className="flex items-center justify-center">
        {isTop3 ? (
          <Trophy className={cn("h-4 w-4", medalColors[entry.rank])} />
        ) : (
          <span className="text-sm text-muted-foreground">{entry.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-2.5 min-w-0">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.username} className="h-8 w-8 rounded-full shrink-0" />
        ) : (
          <AstronautAvatar seed={entry.username} size={32} className="rounded-full shrink-0" />
        )}
        <p className="text-sm font-medium truncate">
          {entry.displayName || entry.username}
          {isCurrentUser && <span className="ml-1.5 text-xs text-accent font-normal">(you)</span>}
        </p>
      </div>

      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div className="h-full rounded-full bg-accent" style={{ width: `${winPercent}%` }} />
          </div>
          <span className="text-sm font-medium">{winPercent}%</span>
        </div>
      </div>

      <div className="text-right">
        <span className="text-sm text-muted-foreground">{entry.totalTrades}</span>
      </div>

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

// ============================================================
// Right panel: Constellations leaderboard
// ============================================================

function ConstellationsPanel() {
  const [sortField, setSortField] = useState<ConstellationSortField>("totalVolume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["constellations-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/constellations?limit=20");
      return res.json();
    },
  });

  const entries: ConstellationLeaderboardEntry[] = data?.data || [];

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [entries, sortField, sortDir]);

  function toggleSort(field: ConstellationSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: ConstellationSortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />;
    return sortDir === "desc"
      ? <ChevronDown className="h-3 w-3" />
      : <ChevronUp className="h-3 w-3" />;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-accent" />
          Constellations
        </h2>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1 text-sm">No constellations yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create one to get started.
          </p>
          <Link
            href="/constellations/create"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Create Constellation
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Sort controls */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-secondary overflow-x-auto scrollbar-hide">
            {[
              { field: "totalVolume" as const, label: "Volume" },
              { field: "totalTrades" as const, label: "Trades" },
              { field: "memberCount" as const, label: "Members" },
              { field: "collectiveAccuracy" as const, label: "Accuracy" },
            ].map((col) => (
              <button
                key={col.field}
                onClick={() => toggleSort(col.field)}
                className={cn(
                  "group flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  sortField === col.field
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {col.label} <SortIcon field={col.field} />
              </button>
            ))}
          </div>

          {/* Rows */}
          {sorted.map((entry, i) => (
            <ConstellationRow key={entry.id} entry={entry} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConstellationRow({
  entry,
  rank,
}: {
  entry: ConstellationLeaderboardEntry;
  rank: number;
}) {
  const isTop3 = rank <= 3;

  return (
    <Link
      href={`/constellations/${entry.slug}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
    >
      {/* Rank */}
      <div className="flex w-6 shrink-0 items-center justify-center">
        {isTop3 ? (
          <Trophy className={cn("h-4 w-4", medalColors[rank])} />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                categoryColors[cat] || categoryColors.other
              )}
            >
              {cat}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground">
            {entry.memberCount} {entry.memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">
          ${formatCompactNumber(entry.totalVolume)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {entry.totalTrades} trades · {Math.round(entry.collectiveAccuracy * 100)}% acc
        </p>
      </div>
    </Link>
  );
}
