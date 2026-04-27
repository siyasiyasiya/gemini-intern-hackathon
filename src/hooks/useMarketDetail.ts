"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketDetail } from "@/types/market";
import type { ApiResponse } from "@/types/api";

async function fetchMarketDetail(ticker: string): Promise<MarketDetail> {
  const res = await fetch(`/api/markets/${encodeURIComponent(ticker)}`);
  const json: ApiResponse<MarketDetail> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data!;
}

export function useMarketDetail(ticker: string | null) {
  return useQuery({
    queryKey: ["market", ticker],
    queryFn: () => fetchMarketDetail(ticker!),
    enabled: !!ticker,
  });
}
