"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  constellationSlug: string;
  marketTicker?: string;
  parentId?: string;
  onSubmit: (data: {
    content: string;
    marketTicker?: string;
    parentId?: string;
    positionDirection?: "yes" | "no";
    positionAmount?: number;
  }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  constellationSlug,
  marketTicker,
  parentId,
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [showPosition, setShowPosition] = useState(false);
  const [direction, setDirection] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        marketTicker,
        parentId,
        positionDirection: showPosition ? direction : undefined,
        positionAmount: showPosition ? Number(amount) / 100 : undefined,
      });
      setContent("");
      setShowPosition(false);
      setAmount("50");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppress unused variable warning
  void constellationSlug;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
      />

      {marketTicker && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPosition(!showPosition)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              showPosition
                ? "border-border-hover bg-muted text-foreground"
                : "border-border text-muted-foreground hover:border-border-hover"
            )}
          >
            Share position
          </button>

          {showPosition && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDirection("yes")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  direction === "yes"
                    ? "bg-yes-bg text-yes-text"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                )}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setDirection("no")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  direction === "no"
                    ? "bg-no-bg text-no-text"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                )}
              >
                NO
              </button>
              <input
                type="number"
                min="1"
                max="99"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-14 rounded border border-input-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:border-foreground focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
