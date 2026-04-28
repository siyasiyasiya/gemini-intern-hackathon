"use client";

import { useState } from "react";
import { MessageSquare, ArrowLeft, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import { useComments, useCreateComment } from "@/hooks/useComments";
import type { ApiResponse, CommentResponse, TrackedMarketResponse } from "@/types/api";
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
  const [filterMarket, setFilterMarket] = useState<string | undefined>(undefined);
  const [activeThread, setActiveThread] = useState<string | null>(null);

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
          } catch {}
        })
      );
      return results;
    },
    enabled: trackedTickers.length > 0,
    staleTime: 60000,
  });

  // Find the parent comment for the active thread
  const activeParent = activeThread
    ? comments?.find((c) => c.id === activeThread)
    : null;

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

  // ── Thread View ─────────────────────────────────────────────────────────
  if (activeThread && activeParent) {
    return (
      <ThreadView
        constellationSlug={constellationSlug}
        marketTicker={marketTicker}
        parentComment={activeParent}
        onBack={() => setActiveThread(null)}
        onSelectMarket={onSelectMarket}
        filterMarket={filterMarket}
      />
    );
  }

  // ── Main Feed ───────────────────────────────────────────────────────────
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
            <Comment
              key={comment.id}
              comment={comment}
              replyCount={comment.replyCount ?? 0}
              onReply={() => setActiveThread(comment.id)}
              onViewThread={() => setActiveThread(comment.id)}
              onSelectMarket={onSelectMarket}
            />
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

// ─── Thread View Component ──────────────────────────────────────────────────

function ThreadView({
  constellationSlug,
  marketTicker,
  parentComment,
  onBack,
  onSelectMarket,
  filterMarket,
}: {
  constellationSlug: string;
  marketTicker?: string;
  parentComment: CommentResponse;
  onBack: () => void;
  onSelectMarket?: (ticker: string) => void;
  filterMarket?: string;
}) {
  const queryClient = useQueryClient();

  const { data: replies, isLoading } = useQuery({
    queryKey: ["replies", constellationSlug, parentComment.id],
    queryFn: async () => {
      const params = new URLSearchParams({ parentId: parentComment.id });
      const res = await fetch(
        `/api/constellations/${constellationSlug}/comments?${params}`
      );
      const json: ApiResponse<CommentResponse[]> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const createReply = useCreateComment(constellationSlug, marketTicker, filterMarket);

  async function handleReply(data: {
    content: string;
    marketTicker?: string;
    parentId?: string;
    positionDirection?: "yes" | "no";
    positionAmount?: number;
    taggedMarkets?: string[];
  }) {
    await createReply.mutateAsync({
      ...data,
      parentId: parentComment.id,
    });
    // Refresh the replies list
    queryClient.invalidateQueries({
      queryKey: ["replies", constellationSlug, parentComment.id],
    });
  }

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to discussion
      </button>

      {/* Parent comment */}
      <Comment
        comment={parentComment}
        onSelectMarket={onSelectMarket}
      />

      {/* Reply separator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>
          {replies?.length ?? parentComment.replyCount ?? 0}{" "}
          {(replies?.length ?? 0) === 1 ? "reply" : "replies"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Replies (flat list) */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-secondary p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : replies && replies.length > 0 ? (
        <div className="space-y-2">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onSelectMarket={onSelectMarket}
              isThreadReply
            />
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No replies yet.
        </p>
      )}

      {/* Reply form */}
      <CommentForm
        constellationSlug={constellationSlug}
        marketTicker={marketTicker}
        parentId={parentComment.id}
        onSubmit={handleReply}
        placeholder="Write a reply..."
      />
    </div>
  );
}
