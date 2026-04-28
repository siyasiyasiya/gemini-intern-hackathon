"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Market } from "@/types/market";
import type { ApiResponse } from "@/types/api";

interface MarketAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (market: Market) => void;
  onClose: () => void;
}

function formatTimeLeft(resolutionDate: string): string {
  const diff = new Date(resolutionDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h`;
}

const CATEGORY_ICONS: Record<string, string> = {
  politics: "🏛️",
  crypto: "₿",
  sports: "⚽",
  entertainment: "🎬",
  science: "🔬",
  economics: "📈",
  technology: "💻",
  commodities: "🛢️",
  business: "💼",
  weather: "🌤️",
  media: "📺",
  culture: "🎭",
  other: "📊",
};

// Debounce the search query so we don't hit the API on every keystroke
function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function MarketAutocomplete({
  query,
  position,
  onSelect,
  onClose,
}: MarketAutocompleteProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: markets, isLoading } = useQuery({
    queryKey: ["market-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/markets?search=${encodeURIComponent(debouncedQuery)}`
      );
      const json: ApiResponse<Market[]> = await res.json();
      return (json.data ?? []).slice(0, 8);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });

  const results = markets ?? [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        onSelect(results[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Show "keep typing" hint if query is too short for search
  const tooShort = debouncedQuery.length < 2 && query.length >= 1;

  return (
    <div
      ref={ref}
      className="absolute z-50 w-80 rounded-lg border border-border bg-card shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
        Tag a market
      </div>
      {tooShort ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          Type at least 2 characters to search...
        </div>
      ) : isLoading ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          Searching markets...
        </div>
      ) : results.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          No markets found for &ldquo;{debouncedQuery}&rdquo;
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto py-1">
          {results.map((market, i) => (
            <button
              key={market.ticker}
              type="button"
              onClick={() => onSelect(market)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                "flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors",
                i === selectedIndex ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <span className="mt-0.5 text-sm">
                {CATEGORY_ICONS[market.category] || "📊"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {market.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-yes-text">
                    Yes {Math.round(market.yesPrice * 100)}¢
                  </span>
                  <span className="text-no-text">
                    No {Math.round(market.noPrice * 100)}¢
                  </span>
                  <span>{formatTimeLeft(market.resolutionDate)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
