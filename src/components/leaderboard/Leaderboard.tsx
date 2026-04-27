"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { useLeaderboard } from "@/hooks/useLeaderboard";

interface LeaderboardProps {
  roomId?: string;
}

const periods = [
  { value: "all_time", label: "All Time" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
] as const;

export function Leaderboard({ roomId }: LeaderboardProps) {
  const [period, setPeriod] = useState<string>("all_time");
  const { data: entries, isLoading, error } = useLeaderboard(roomId, period);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </div>

        <div className="flex rounded-lg border border-zinc-700 bg-zinc-800 p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-zinc-600 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 rounded-lg bg-zinc-800/50 px-4 py-3">
              <div className="h-5 w-8 rounded bg-zinc-700" />
              <div className="h-9 w-9 rounded-full bg-zinc-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-zinc-700" />
                <div className="h-2.5 w-16 rounded bg-zinc-700" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-3 w-16 rounded bg-zinc-700" />
                <div className="h-2.5 w-20 rounded bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load leaderboard.
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {entries.map((entry) => (
            <LeaderboardEntry key={entry.userId} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-zinc-500">
          No leaderboard data yet.
        </p>
      )}
    </div>
  );
}
