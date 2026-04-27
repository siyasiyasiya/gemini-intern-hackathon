"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, X } from "lucide-react";
import type { ApiResponse, TrackedMarketResponse } from "@/types/api";

interface TrackedMarketsProps {
  communitySlug: string;
  canManage: boolean;
  onSelectMarket?: (ticker: string) => void;
}

export function TrackedMarkets({ communitySlug, canManage, onSelectMarket }: TrackedMarketsProps) {
  const queryClient = useQueryClient();

  const { data: markets } = useQuery({
    queryKey: ["tracked-markets", communitySlug],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communitySlug}/tracked-markets`);
      const json: ApiResponse<TrackedMarketResponse[]> = await res.json();
      return json.data || [];
    },
  });

  async function handleUnpin(ticker: string) {
    await fetch(`/api/communities/${communitySlug}/tracked-markets?marketTicker=${encodeURIComponent(ticker)}`, {
      method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: ["tracked-markets", communitySlug] });
  }

  if (!markets || markets.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <Pin className="h-3 w-3" />
        Pinned Markets
      </div>
      <div className="space-y-1">
        {markets.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm hover:bg-secondary/80 transition-colors cursor-pointer"
            onClick={() => onSelectMarket?.(m.marketTicker)}
          >
            <span className="font-medium truncate">{m.marketTicker}</span>
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); handleUnpin(m.marketTicker); }}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
