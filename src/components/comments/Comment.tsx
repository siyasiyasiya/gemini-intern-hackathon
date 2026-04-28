"use client";

import { useState } from "react";
import { MessageSquare, Heart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { MarketPill } from "./MarketPill";
import type { CommentResponse } from "@/types/api";

interface CommentProps {
  comment: CommentResponse;
  onReply?: (commentId: string) => void;
  onSelectMarket?: (ticker: string) => void;
  isNested?: boolean;
}

const MARKET_TOKEN_REGEX = /\{\{market:([^}]+)\}\}/g;

function renderContentWithPills(
  content: string,
  onSelectMarket?: (ticker: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(MARKET_TOKEN_REGEX.source, "g");
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const ticker = match[1];
    parts.push(
      <MarketPill
        key={`${ticker}-${match.index}`}
        ticker={ticker}
        onClick={onSelectMarket}
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function Comment({
  comment,
  onReply,
  onSelectMarket,
  isNested = false,
}: CommentProps) {
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [liked, setLiked] = useState(comment.likedByMe);
  const [liking, setLiking] = useState(false);

  const initials = (comment.user.displayName || comment.user.username)
    .slice(0, 2)
    .toUpperCase();

  const hasTaggedMarkets =
    comment.taggedMarkets && comment.taggedMarkets.length > 0;

  async function toggleLike() {
    if (liking) return;
    setLiking(true);

    // Optimistic update
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
      const json = await res.json();
      if (json.data) {
        setLiked(json.data.liked);
        setLikeCount(json.data.likeCount);
      }
    } catch {
      // Revert on error
      setLiked(liked);
      setLikeCount(comment.likeCount);
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className={cn("group", isNested && "ml-8 border-l-2 border-border pl-4")}>
      <div
        className={cn(
          "rounded-lg bg-secondary p-4",
          hasTaggedMarkets && "border-l-2 border-accent"
        )}
      >
        <div className="flex items-start gap-3">
          {comment.user.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {comment.user.displayName || comment.user.username}
              </span>
              <span className="text-xs text-muted-foreground">
                @{comment.user.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(new Date(comment.createdAt))}
              </span>
              {hasTaggedMarkets && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  {comment.taggedMarkets!.length}
                </span>
              )}
            </div>

            {comment.positionDirection && comment.positionAmount != null && (
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  comment.positionDirection === "yes"
                    ? "bg-yes-bg text-yes-text"
                    : "bg-no-bg text-no-text"
                )}
              >
                {comment.positionDirection === "yes" ? "YES" : "NO"}{" "}
                ${Math.round(comment.positionAmount)}
              </span>
            )}

            <div className="mt-1.5 text-sm text-foreground-secondary leading-relaxed">
              {renderContentWithPills(comment.content, onSelectMarket)}
            </div>

            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={toggleLike}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  liked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>

              {onReply && !isNested && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onSelectMarket={onSelectMarket}
              isNested
            />
          ))}
        </div>
      )}
    </div>
  );
}
