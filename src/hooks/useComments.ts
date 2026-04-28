"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, CommentResponse } from "@/types/api";

async function fetchComments(
  constellationSlug: string,
  marketTicker?: string,
  taggedMarket?: string
): Promise<CommentResponse[]> {
  const params = new URLSearchParams();
  if (marketTicker) params.set("marketTicker", marketTicker);
  if (taggedMarket) params.set("taggedMarket", taggedMarket);

  const res = await fetch(
    `/api/constellations/${constellationSlug}/comments?${params.toString()}`
  );
  const json: ApiResponse<CommentResponse[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
}

export function useComments(
  constellationSlug: string,
  marketTicker?: string,
  taggedMarket?: string
) {
  return useQuery({
    queryKey: ["comments", constellationSlug, marketTicker, taggedMarket],
    queryFn: () => fetchComments(constellationSlug, marketTicker, taggedMarket),
    enabled: !!constellationSlug,
  });
}

export function useCreateComment(
  constellationSlug: string,
  marketTicker?: string,
  taggedMarket?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      marketTicker?: string;
      parentId?: string;
      positionDirection?: "yes" | "no";
      positionAmount?: number;
      positionContractLabel?: string;
      taggedMarkets?: string[];
    }) => {
      const res = await fetch(`/api/constellations/${constellationSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: ApiResponse<CommentResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", constellationSlug, marketTicker, taggedMarket],
      });
      // Also invalidate unfiltered view
      if (taggedMarket) {
        queryClient.invalidateQueries({
          queryKey: ["comments", constellationSlug, marketTicker, undefined],
        });
      }
    },
  });
}
