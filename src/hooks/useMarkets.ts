"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market, MarketFilters } from "@/types/market";
import type { ApiResponse } from "@/types/api";

async function fetchMarkets(filters?: MarketFilters): Promise<Market[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);

  const res = await fetch(`/api/markets?${params.toString()}`);
  const json: ApiResponse<Market[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data!;
}

export function useMarkets(filters?: MarketFilters) {
  return useQuery({
    queryKey: ["markets", filters],
    queryFn: () => fetchMarkets(filters),
  });
}
