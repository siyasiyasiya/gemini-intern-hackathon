"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Heart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { MarketPill } from "./MarketPill";
import { AstronautAvatar } from "@/components/ui/AstronautAvatar";
import type { CommentResponse } from "@/types/api";

interface CommentProps {
  comment: CommentResponse;
  onReply?: (commentId: string) => void;
  onViewThread?: (commentId: string) => void;
  onSelectMarket?: (ticker: string) => void;
  replyCount?: number;
  isThreadReply?: boolean;
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
  onViewThread,
  onSelectMarket,
  replyCount = 0,
  isThreadReply = false,
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
      setLiked(liked);
      setLikeCount(comment.likeCount);
    } finally {
      setLiking(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-secondary p-4",
        hasTaggedMarkets && "border-l-2 border-accent"
      )}
    >
      <div className="flex items-start gap-3">
        <Link href={`/profile/${comment.user.username}`}>
          {comment.user.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <AstronautAvatar seed={comment.user.username} size={32} className="rounded-full" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${comment.user.username}`}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {comment.user.displayName || comment.user.username}
            </Link>
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

          {comment.marketTicker && (
            onSelectMarket ? (
              <button
                onClick={() => onSelectMarket(comment.marketTicker!)}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                <BarChart3 className="h-2.5 w-2.5" />
                {comment.marketTicker}
              </button>
            ) : (
              <Link
                href={`/markets/${encodeURIComponent(comment.marketTicker)}`}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                <BarChart3 className="h-2.5 w-2.5" />
                {comment.marketTicker}
              </Link>
            )
          )}

          {comment.positionDirection && comment.positionAmount != null && (
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                comment.positionDirection === "yes"
                  ? "bg-yes-bg text-yes-text"
                  : "bg-no-bg text-no-text"
              )}
            >
              {comment.positionContractLabel && `${comment.positionContractLabel} · `}
              {comment.positionDirection === "yes" ? "YES" : "NO"}{" "}
              @ {Math.round(comment.positionAmount * 100)}¢
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

            {onReply && !(!isThreadReply && replyCount > 0 && onViewThread) && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {!isThreadReply && replyCount > 0 && onViewThread && (
              <button
                onClick={() => onViewThread(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
