"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  roomId: string;
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
  roomId,
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
  void roomId;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      {marketTicker && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPosition(!showPosition)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              showPosition
                ? "border-zinc-500 bg-zinc-700 text-zinc-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
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
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                className="w-14 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
              />
              <span className="text-xs text-zinc-500">%</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
