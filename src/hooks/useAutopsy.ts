"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutopsyResponse, ExternalEvent } from "@/lib/autopsy/types";

interface AutopsyData {
  data?: AutopsyResponse;
}

export function useAutopsy(ticker: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useQuery<AutopsyData>({
    queryKey: ["autopsy", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${encodeURIComponent(ticker)}/autopsy`);
      if (!res.ok) throw new Error("Failed to fetch autopsy");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Start SSE stream once we have inflection points
  useEffect(() => {
    const inflections = query.data?.data?.inflectionPoints;
    if (!inflections || inflections.length === 0) return;

    // Only stream for inflections that don't have events yet
    const needsAI = inflections.filter((ip) => !ip.externalEvent);
    if (needsAI.length === 0) return;

    const ids = needsAI.map((ip) => ip.id).join(",");
    const data = encodeURIComponent(JSON.stringify(needsAI));
    const url = `/api/markets/${encodeURIComponent(ticker)}/autopsy/stream?inflections=${ids}&data=${data}`;

    // Close any existing stream
    eventSourceRef.current?.close();

    const es = new EventSource(url);
    eventSourceRef.current = es;
    setIsStreaming(true);
    let completed = 0;

    es.addEventListener("inflection-update", (e) => {
      const { inflectionId, externalEvent } = JSON.parse(e.data) as {
        inflectionId: string;
        externalEvent: ExternalEvent;
      };

      // Merge into query cache
      queryClient.setQueryData<AutopsyData>(["autopsy", ticker], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            inflectionPoints: old.data.inflectionPoints.map((ip) =>
              ip.id === inflectionId ? { ...ip, externalEvent } : ip
            ),
          },
        };
      });

      completed++;
      setStreamProgress(Math.round((completed / needsAI.length) * 100));
    });

    es.addEventListener("done", () => {
      es.close();
      setIsStreaming(false);
      setStreamProgress(100);
    });

    es.onerror = () => {
      es.close();
      setIsStreaming(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [query.data?.data?.inflectionPoints, ticker, queryClient]);

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isStreaming,
    streamProgress,
  };
}
