"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, CommentResponse } from "@/types/api";

async function fetchComments(
  roomId: string,
  marketTicker?: string
): Promise<CommentResponse[]> {
  const params = new URLSearchParams();
  if (marketTicker) params.set("marketTicker", marketTicker);

  const res = await fetch(
    `/api/rooms/${roomId}/comments?${params.toString()}`
  );
  const json: ApiResponse<CommentResponse[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
}

export function useComments(roomId: string, marketTicker?: string) {
  return useQuery({
    queryKey: ["comments", roomId, marketTicker],
    queryFn: () => fetchComments(roomId, marketTicker),
    enabled: !!roomId,
  });
}

export function useCreateComment(roomId: string, marketTicker?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      marketTicker?: string;
      parentId?: string;
      positionDirection?: "yes" | "no";
      positionAmount?: number;
    }) => {
      const res = await fetch(`/api/rooms/${roomId}/comments`, {
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
        queryKey: ["comments", roomId, marketTicker],
      });
    },
  });
}
