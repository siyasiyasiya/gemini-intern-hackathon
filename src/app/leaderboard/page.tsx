"use client";

import { useQuery } from "@tanstack/react-query";
import { LeaderboardEntry } from "@/components/leaderboard/LeaderboardEntry";
import type { LeaderboardEntryResponse } from "@/types/api";

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-full"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?limit=50");
      return res.json();
    },
  });

  const entries: LeaderboardEntryResponse[] = data?.data || [];

  return (
    <main className="mx-auto max-w-3xl px-4 lg:px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No traders yet. Start trading to appear on the leaderboard.
          </div>
        ) : (
          entries.map((entry) => (
            <LeaderboardEntry key={entry.userId} entry={entry} />
          ))
        )}
      </div>
    </main>
  );
}
