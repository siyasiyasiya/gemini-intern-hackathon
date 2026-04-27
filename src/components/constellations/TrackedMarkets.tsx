"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, X } from "lucide-react";
import type { ApiResponse, TrackedMarketResponse } from "@/types/api";

interface TrackedMarketsProps {
  constellationSlug: string;
  canManage: boolean;
  onSelectMarket?: (ticker: string) => void;
}

async function fetchMarketTitles(tickers: string[]): Promise<Record<string, string>> {
  const titles: Record<string, string> = {};
  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://api.gemini.com/v1/prediction-markets/events/${encodeURIComponent(ticker)}`
        );
        if (res.ok) {
          const json = await res.json();
          const event = json.data ?? json;
          if (event?.title) {
            titles[ticker] = event.title;
          }
        }
      } catch {
        // ignore — will fall back to ticker
      }
    })
  );
  return titles;
}

export function TrackedMarkets({ constellationSlug, canManage, onSelectMarket }: TrackedMarketsProps) {
  const queryClient = useQueryClient();

  const { data: markets } = useQuery({
    queryKey: ["tracked-markets", constellationSlug],
    queryFn: async () => {
      const res = await fetch(`/api/constellations/${constellationSlug}/tracked-markets`);
      const json: ApiResponse<TrackedMarketResponse[]> = await res.json();
      return json.data || [];
    },
  });

  const tickers = markets?.map((m) => m.marketTicker) ?? [];
  const { data: titleMap } = useQuery({
    queryKey: ["market-titles", tickers],
    queryFn: () => fetchMarketTitles(tickers),
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  async function handleUnpin(ticker: string) {
    await fetch(`/api/constellations/${constellationSlug}/tracked-markets?marketTicker=${encodeURIComponent(ticker)}`, {
      method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: ["tracked-markets", constellationSlug] });
  }

  if (!markets || markets.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <Pin className="h-3 w-3" />
        Pinned Markets
      </div>
      <div className="space-y-1">
        {markets.map((m) => {
          const title = titleMap?.[m.marketTicker];
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm hover:bg-secondary/80 transition-colors cursor-pointer"
              onClick={() => onSelectMarket?.(m.marketTicker)}
              title={m.marketTicker}
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block">
                  {title || m.marketTicker}
                </span>
                {title && (
                  <span className="text-xs text-muted-foreground truncate block">
                    {m.marketTicker}
                  </span>
                )}
              </div>
              {canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnpin(m.marketTicker); }}
                  className="shrink-0 ml-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
