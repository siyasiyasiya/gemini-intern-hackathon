"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, LeaderboardEntryResponse } from "@/types/api";

async function fetchLeaderboard(
  constellationId?: string,
  period?: string
): Promise<LeaderboardEntryResponse[]> {
  const params = new URLSearchParams();
  if (constellationId) params.set("constellationId", constellationId);
  if (period) params.set("period", period);

  const res = await fetch(`/api/leaderboard?${params.toString()}`);
  const json: ApiResponse<LeaderboardEntryResponse[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
}

export function useLeaderboard(constellationId?: string, period?: string) {
  return useQuery({
    queryKey: ["leaderboard", constellationId, period],
    queryFn: () => fetchLeaderboard(constellationId, period),
  });
}
