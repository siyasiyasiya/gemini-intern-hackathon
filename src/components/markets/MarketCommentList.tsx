"use client";

import { useState, useRef, useEffect } from "react";
import { useMarketComments } from "@/hooks/useMarketComments";
import { FeedItem } from "@/components/feed/FeedItem";
import { MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketCommentListProps {
  ticker: string;
}

export function MarketCommentList({ ticker }: MarketCommentListProps) {
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMarketComments(ticker, sort);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
        {(["latest", "trending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize",
              sort === s
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No discussion about this market yet
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {allItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
