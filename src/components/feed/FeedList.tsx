"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeed } from "@/hooks/useFeed";
import { FeedItem } from "./FeedItem";
import Link from "next/link";

const sortOptions = [
  { value: "latest" as const, label: "Latest" },
  { value: "trending" as const, label: "Trending" },
];

export function FeedList() {
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeed(sort);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex rounded-lg border border-border bg-secondary p-0.5 w-fit">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
              sort === opt.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-4 w-12 rounded-full bg-muted" />
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Join some constellations to see posts in your feed!
          </p>
          <Link
            href="/constellations"
            className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Explore Constellations
          </Link>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
