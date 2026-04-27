"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { CommentResponse } from "@/types/api";

interface CommentProps {
  comment: CommentResponse;
  onReply?: (commentId: string) => void;
  isNested?: boolean;
}

export function Comment({ comment, onReply, isNested = false }: CommentProps) {
  const initials = (comment.user.displayName || comment.user.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("group", isNested && "ml-8 border-l-2 border-border pl-4")}>
      <div className="rounded-lg bg-secondary p-4">
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

            <p className="mt-1.5 text-sm text-foreground-secondary">{comment.content}</p>

            {onReply && !isNested && (
              <button
                onClick={() => onReply(comment.id)}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} isNested />
          ))}
        </div>
      )}
    </div>
  );
}
