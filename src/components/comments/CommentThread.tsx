"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import { useComments, useCreateComment } from "@/hooks/useComments";

interface CommentThreadProps {
  constellationSlug: string;
  marketTicker?: string;
}

export function CommentThread({ constellationSlug, marketTicker }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { data: comments, isLoading, error } = useComments(constellationSlug, marketTicker);
  const createComment = useCreateComment(constellationSlug, marketTicker);

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
                onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
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
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
