"use client";

import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketAutocomplete } from "./MarketAutocomplete";
import type { Market } from "@/types/market";

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
    taggedMarkets?: string[];
  }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  politics: "🏛️",
  crypto: "₿",
  sports: "⚽",
  entertainment: "🎬",
  science: "🔬",
  economics: "📈",
  technology: "💻",
  other: "📊",
};

export function CommentForm({
  constellationSlug,
  marketTicker,
  parentId,
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts... (type $ to tag a market)",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [showPosition, setShowPosition] = useState(false);
  const [direction, setDirection] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taggedMarkets, setTaggedMarkets] = useState<Market[]>([]);
  const [autocomplete, setAutocomplete] = useState<{
    query: string;
    position: { top: number; left: number };
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);

    // Check for $ trigger
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Find the last $ that starts a market mention
    const lastDollar = textBeforeCursor.lastIndexOf("$");
    if (lastDollar === -1) {
      setAutocomplete(null);
      return;
    }

    // Only trigger if $ is at start of text or preceded by whitespace
    const charBefore = lastDollar > 0 ? textBeforeCursor[lastDollar - 1] : " ";
    if (charBefore !== " " && charBefore !== "\n" && lastDollar !== 0) {
      setAutocomplete(null);
      return;
    }

    const query = textBeforeCursor.slice(lastDollar + 1);

    // Close if there's a space after query started (user moved on)
    if (query.includes(" ") || query.includes("\n")) {
      setAutocomplete(null);
      return;
    }

    if (query.length >= 1) {
      // Position dropdown below the textarea
      const rect = textarea.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const top = rect.bottom - (containerRect?.top ?? 0) + 4;
      const left = 0;
      setAutocomplete({ query, position: { top, left } });
    } else {
      setAutocomplete(null);
    }
  }, []);

  const handleSelectMarket = useCallback(
    (market: Market) => {
      // Remove the $query from content and add the market token
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.slice(0, cursorPos);
      const lastDollar = textBeforeCursor.lastIndexOf("$");
      const textAfter = content.slice(cursorPos);

      const newContent =
        content.slice(0, lastDollar) +
        `{{market:${market.ticker}}} ` +
        textAfter;

      setContent(newContent);

      // Add to tagged markets if not already there
      if (!taggedMarkets.some((m) => m.ticker === market.ticker)) {
        setTaggedMarkets((prev) => [...prev, market]);
      }

      setAutocomplete(null);

      // Refocus textarea
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastDollar + `{{market:${market.ticker}}} `.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content, taggedMarkets]
  );

  const removeTaggedMarket = (ticker: string) => {
    setTaggedMarkets((prev) => prev.filter((m) => m.ticker !== ticker));
    // Remove the token from content
    setContent((prev) => prev.replace(`{{market:${ticker}}}`, "").replace(/  +/g, " ").trim());
  };

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
        taggedMarkets:
          taggedMarkets.length > 0
            ? taggedMarkets.map((m) => m.ticker)
            : undefined,
      });
      setContent("");
      setShowPosition(false);
      setAmount("50");
      setTaggedMarkets([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppress unused variable warning
  void constellationSlug;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div ref={containerRef} className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
        />
        {autocomplete && (
          <MarketAutocomplete
            query={autocomplete.query}
            position={autocomplete.position}
            onSelect={handleSelectMarket}
            onClose={() => setAutocomplete(null)}
          />
        )}
      </div>

      {/* Tagged market pills */}
      {taggedMarkets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {taggedMarkets.map((market) => (
            <span
              key={market.ticker}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-foreground"
            >
              <span>{CATEGORY_ICONS[market.category] || "📊"}</span>
              <span className="max-w-[160px] truncate">{market.title}</span>
              <button
                type="button"
                onClick={() => removeTaggedMarket(market.ticker)}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

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
