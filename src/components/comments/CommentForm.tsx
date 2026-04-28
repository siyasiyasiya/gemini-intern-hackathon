"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MarketAutocomplete } from "./MarketAutocomplete";
import type { Market, ContractSummary } from "@/types/market";

interface CommentFormProps {
  constellationSlug: string;
  marketTicker?: string;
  parentId?: string;
  outcomes?: ContractSummary[];
  onSubmit: (data: {
    content: string;
    marketTicker?: string;
    parentId?: string;
    positionDirection?: "yes" | "no";
    positionAmount?: number;
    positionContractLabel?: string;
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

function createPillElement(market: Market): HTMLSpanElement {
  const icon = CATEGORY_ICONS[market.category] || "📊";
  const label = market.title.length > 28 ? market.title.slice(0, 28) + "…" : market.title;
  const pill = document.createElement("span");
  pill.contentEditable = "false";
  pill.dataset.marketTicker = market.ticker;
  pill.dataset.marketTitle = market.title;
  pill.dataset.marketCategory = market.category;
  pill.className =
    "inline-flex items-center gap-0.5 rounded-full bg-accent/10 border border-accent/20 px-1.5 py-px text-xs font-medium text-foreground mx-0.5 align-baseline cursor-default select-none";
  pill.textContent = `${icon} ${label}`;
  return pill;
}

function getTextBeforeCursor(editor: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.startContainer)) return null;

  const preRange = document.createRange();
  preRange.selectNodeContents(editor);
  preRange.setEnd(range.startContainer, range.startOffset);
  const fragment = preRange.cloneContents();
  const div = document.createElement("div");
  div.appendChild(fragment);
  return div.textContent ?? "";
}

function extractContent(editor: HTMLElement): {
  text: string;
  tickers: string[];
} {
  const tickers: string[] = [];
  let text = "";
  for (const node of Array.from(editor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.marketTicker) {
        const ticker = node.dataset.marketTicker;
        text += `{{market:${ticker}}}`;
        if (!tickers.includes(ticker)) tickers.push(ticker);
      } else if (node.tagName === "BR") {
        text += "\n";
      } else {
        text += node.textContent ?? "";
      }
    }
  }
  return { text, tickers };
}

export function CommentForm({
  constellationSlug,
  marketTicker,
  parentId,
  outcomes,
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts... (type $ to tag a market)",
}: CommentFormProps) {
  const [showPosition, setShowPosition] = useState(false);
  const [direction, setDirection] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("50");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [autocomplete, setAutocomplete] = useState<{
    query: string;
    position: { top: number; left: number };
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const checkAutocomplete = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const textBefore = getTextBeforeCursor(editor);
    if (!textBefore) { setAutocomplete(null); return; }

    const lastDollar = textBefore.lastIndexOf("$");
    if (lastDollar === -1) { setAutocomplete(null); return; }

    const charBefore = lastDollar > 0 ? textBefore[lastDollar - 1] : " ";
    if (charBefore !== " " && charBefore !== "\n" && lastDollar !== 0) {
      setAutocomplete(null);
      return;
    }

    const query = textBefore.slice(lastDollar + 1);
    if (query.includes(" ") || query.includes("\n")) { setAutocomplete(null); return; }

    if (query.length >= 1) {
      const rect = editor.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const top = rect.bottom - (containerRect?.top ?? 0) + 4;
      setAutocomplete({ query, position: { top, left: 0 } });
    } else {
      setAutocomplete(null);
    }
  }, []);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const tc = editor.textContent?.trim() ?? "";
    setIsEmpty(tc.length === 0 && editor.querySelectorAll("[data-market-ticker]").length === 0);
    checkAutocomplete();
  }, [checkAutocomplete]);

  const handleSelectMarket = useCallback((market: Market) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
      const text = textNode.textContent;
      const cursorOffset = range.startOffset;
      const textUpToCursor = text.slice(0, cursorOffset);
      const lastDollar = textUpToCursor.lastIndexOf("$");

      if (lastDollar !== -1) {
        const beforeDollar = text.slice(0, lastDollar);
        const afterCursor = text.slice(cursorOffset);
        const parent = textNode.parentNode!;
        const pill = createPillElement(market);
        const spaceAfter = document.createTextNode("\u00A0");

        if (beforeDollar) {
          parent.insertBefore(document.createTextNode(beforeDollar), textNode);
        }
        parent.insertBefore(pill, textNode);
        parent.insertBefore(spaceAfter, textNode);

        if (afterCursor) {
          textNode.textContent = afterCursor;
        } else {
          parent.removeChild(textNode);
        }

        const newRange = document.createRange();
        newRange.setStartAfter(spaceAfter);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }

    setAutocomplete(null);
    setIsEmpty(false);
    editor.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (autocomplete && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      return; // handled by MarketAutocomplete
    }
    if (e.key === "Enter" && !e.shiftKey && !autocomplete) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, [autocomplete]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (!editor || isSubmitting) return;

    const { text, tickers } = extractContent(editor);
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: trimmed,
        marketTicker,
        parentId,
        positionDirection: showPosition ? direction : undefined,
        positionAmount: showPosition ? Number(amount) / 100 : undefined,
        positionContractLabel: showPosition && selectedOutcome ? selectedOutcome : undefined,
        taggedMarkets: tickers.length > 0 ? tickers : undefined,
      });
      editor.innerHTML = "";
      setIsEmpty(true);
      setShowPosition(false);
      setAmount("50");
      setSelectedOutcome("");
    } finally {
      setIsSubmitting(false);
    }
  };

  void constellationSlug;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div ref={containerRef} className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            "min-h-[4.5rem] w-full rounded-lg border border-input-border bg-background px-3 py-2 text-sm text-foreground leading-relaxed focus:border-foreground focus:outline-none",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
          )}
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
            <div className="flex flex-wrap items-center gap-2">
              {outcomes && outcomes.length > 1 && (
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  className="rounded border border-input-border bg-background px-2 py-1 text-xs text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="">Pick outcome...</option>
                  {outcomes.map((o) => (
                    <option key={o.ticker} value={o.label}>
                      {o.label} ({Math.round(o.yesPrice * 100)}%)
                    </option>
                  ))}
                </select>
              )}
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
          disabled={isEmpty || isSubmitting}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
