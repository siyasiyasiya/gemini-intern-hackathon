"use client";

import { useState } from "react";
import { ExternalLink, Newspaper, BarChart3, Mic, Gavel, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExternalEvent, AutopsyComment } from "@/lib/autopsy/types";

const eventTypeIcons: Record<string, typeof Newspaper> = {
  news: Newspaper,
  data_release: BarChart3,
  speech: Mic,
  ruling: Gavel,
  other: HelpCircle,
};

interface AutopsyEventCardProps {
  event: ExternalEvent | null;
  isStreaming?: boolean;
  relatedComments?: AutopsyComment[];
  direction: "up" | "down";
}

export function AutopsyEventCard({ event, isStreaming, relatedComments, direction }: AutopsyEventCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (isStreaming || !event) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 animate-pulse min-w-[200px]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
        <div className="mt-2 h-2.5 w-full rounded bg-muted" />
        <div className="mt-1.5 h-2.5 w-2/3 rounded bg-muted" />
      </div>
    );
  }

  if (event.confidence === 0 && event.headline === "Unknown catalyst") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Unknown catalyst</span>
        </div>
      </div>
    );
  }

  const Icon = eventTypeIcons[event.eventType] || HelpCircle;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "rounded-lg border bg-card p-3 text-left transition-all min-w-[200px] max-w-[320px]",
        "hover:bg-card-hover",
        direction === "up" ? "border-yes-text/20" : "border-no-text/20"
      )}
    >
      {/* Collapsed */}
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", direction === "up" ? "text-yes-text" : "text-no-text")} />
        <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
          {event.headline}
        </span>
        {event.confidence > 0 && (
          <span className={cn(
            "text-[10px] font-medium rounded-full px-1.5 py-0.5",
            event.confidence >= 0.7 ? "bg-yes-bg text-yes-text" : "bg-muted text-muted-foreground"
          )}>
            {Math.round(event.confidence * 100)}%
          </span>
        )}
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          {event.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed">{event.summary}</p>
          )}
          {event.sources.length > 0 && (
            <div className="space-y-1">
              {event.sources.slice(0, 3).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </div>
          )}
          {relatedComments && relatedComments.length > 0 && (
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                Community ({relatedComments.length})
              </p>
              {relatedComments.slice(0, 2).map((c) => (
                <div key={c.id} className="text-[10px] text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">@{c.username}</span>{" "}
                  <span className="line-clamp-1">{c.content.replace(/\{\{market:[^}]+\}\}/g, "").trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
