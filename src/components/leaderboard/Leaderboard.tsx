"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { useLeaderboard } from "@/hooks/useLeaderboard";

interface LeaderboardProps {
  communityId?: string;
}

const periods = [
  { value: "all_time", label: "All Time" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
] as const;

export function Leaderboard({ communityId }: LeaderboardProps) {
  const [period, setPeriod] = useState<string>("all_time");
  const { data: entries, isLoading, error } = useLeaderboard(communityId, period);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </div>

        <div className="flex rounded-lg border border-border bg-secondary p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                period === p.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
            <div key={i} className="animate-pulse flex items-center gap-4 rounded-lg bg-secondary px-4 py-3">
              <div className="h-5 w-8 rounded bg-muted" />
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2.5 w-16 rounded bg-muted" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-2.5 w-20 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-no-bg p-4 text-sm text-destructive">
          Failed to load leaderboard.
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border border-border">
          {entries.map((entry) => (
            <LeaderboardEntry key={entry.userId} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No leaderboard data yet.
        </p>
      )}
    </div>
  );
}
