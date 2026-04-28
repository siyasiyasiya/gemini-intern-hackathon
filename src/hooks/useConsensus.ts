"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConsensusData, CategoricalConsensusData, ApiResponse } from "@/types/api";

export function useConsensus(constellationSlug: string, ticker: string) {
  return useQuery({
    queryKey: ["consensus", constellationSlug, ticker],
    queryFn: async (): Promise<ConsensusData | null> => {
      const res = await fetch(
        `/api/constellations/${encodeURIComponent(constellationSlug)}/consensus/${encodeURIComponent(ticker)}`
      );
      const json: ApiResponse<ConsensusData | null> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data ?? null;
    },
    enabled: !!constellationSlug && !!ticker,
    staleTime: 30_000,
  });
}

export function useCategoricalConsensus(constellationSlug: string, ticker: string, enabled: boolean) {
  return useQuery({
    queryKey: ["consensus", constellationSlug, ticker, "categorical"],
    queryFn: async (): Promise<CategoricalConsensusData | null> => {
      const res = await fetch(
        `/api/constellations/${encodeURIComponent(constellationSlug)}/consensus/${encodeURIComponent(ticker)}?categorical=true`
      );
      const json: ApiResponse<CategoricalConsensusData | null> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data ?? null;
    },
    enabled: !!constellationSlug && !!ticker && enabled,
    staleTime: 30_000,
  });
}
