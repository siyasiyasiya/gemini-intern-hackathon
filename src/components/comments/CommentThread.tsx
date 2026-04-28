"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import { useComments, useCreateComment } from "@/hooks/useComments";
import type { ApiResponse, TrackedMarketResponse } from "@/types/api";
import type { Market } from "@/types/market";

interface CommentThreadProps {
  constellationSlug: string;
  marketTicker?: string;
  onSelectMarket?: (ticker: string) => void;
}

export function CommentThread({
  constellationSlug,
  marketTicker,
  onSelectMarket,
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [filterMarket, setFilterMarket] = useState<string | undefined>(undefined);

  const { data: comments, isLoading, error } = useComments(
    constellationSlug,
    marketTicker,
    filterMarket
  );
  const createComment = useCreateComment(constellationSlug, marketTicker, filterMarket);

  // Fetch tracked markets for filter tabs
  const { data: trackedMarkets } = useQuery({
    queryKey: ["tracked-markets", constellationSlug],
    queryFn: async () => {
      const res = await fetch(
        `/api/constellations/${constellationSlug}/tracked-markets`
      );
      const json: ApiResponse<TrackedMarketResponse[]> = await res.json();
      return json.data ?? [];
    },
  });

  // Fetch market titles for tracked markets
  const trackedTickers = trackedMarkets?.map((tm) => tm.marketTicker) ?? [];
  const { data: marketTitles } = useQuery({
    queryKey: ["market-titles", trackedTickers],
    queryFn: async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        trackedTickers.map(async (ticker) => {
          try {
            const res = await fetch(`/api/markets/${encodeURIComponent(ticker)}`);
            const json: ApiResponse<Market> = await res.json();
            if (json.data) results[ticker] = json.data.title;
          } catch {
            // skip
          }
        })
      );
      return results;
    },
    enabled: trackedTickers.length > 0,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-secondary p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-no-bg p-4 text-sm text-destructive">
        Failed to load comments. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4" />
        Discussion {comments && comments.length > 0 && `(${comments.length})`}
      </div>

      {/* Market filter tabs */}
      {trackedTickers.length > 0 && !marketTicker && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterMarket(undefined)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !filterMarket
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            All posts
          </button>
          {trackedTickers.map((ticker) => (
            <button
              key={ticker}
              onClick={() =>
                setFilterMarket(filterMarket === ticker ? undefined : ticker)
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors max-w-[200px] truncate",
                filterMarket === ticker
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {marketTitles?.[ticker]
                ? marketTitles[ticker].length > 30
                  ? marketTitles[ticker].slice(0, 30) + "..."
                  : marketTitles[ticker]
                : ticker}
            </button>
          ))}
        </div>
      )}

      <CommentForm
        constellationSlug={constellationSlug}
        marketTicker={marketTicker}
        onSubmit={async (data) => {
          await createComment.mutateAsync(data);
        }}
      />

      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id}>
              <Comment
                comment={comment}
                onReply={(id) =>
                  setReplyingTo(replyingTo === id ? null : id)
                }
                onSelectMarket={onSelectMarket}
              />
              {replyingTo === comment.id && (
                <div className="ml-8 mt-2 border-l-2 border-border pl-4">
                  <CommentForm
                    constellationSlug={constellationSlug}
                    marketTicker={marketTicker}
                    parentId={comment.id}
                    onSubmit={async (data) => {
                      await createComment.mutateAsync(data);
                      setReplyingTo(null);
                    }}
                    onCancel={() => setReplyingTo(null)}
                    placeholder="Write a reply..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {filterMarket
            ? "No posts about this market yet."
            : "No comments yet. Be the first to share your thoughts!"}
        </p>
      )}
    </div>
  );
}
