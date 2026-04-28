"use client";

import Link from "next/link";
import { MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Comment } from "@/components/comments/Comment";
import type { FeedItemResponse } from "@/types/api";

const topicColors: Record<string, string> = {
  politics: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  sports: "bg-green-500/20 text-green-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  science: "bg-cyan-500/20 text-cyan-400",
  economics: "bg-yellow-500/20 text-yellow-400",
  technology: "bg-purple-500/20 text-purple-400",
  other: "bg-muted text-muted-foreground",
};

interface FeedItemProps {
  item: FeedItemResponse;
}

export function FeedItem({ item }: FeedItemProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Constellation header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Link
          href={`/constellations/${item.constellation.slug}`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          {item.constellation.name}
        </Link>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
            topicColors[item.constellation.topic] || topicColors.other
          )}
        >
          {item.constellation.topic}
        </span>
        {item.marketTicker && (
          <Link
            href={`/markets/${encodeURIComponent(item.marketTicker)}`}
            className="ml-auto flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            <BarChart3 className="h-2.5 w-2.5" />
            {item.marketTicker}
          </Link>
        )}
      </div>

      {/* Comment content */}
      <div className="px-4 pb-2">
        <Comment comment={item} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          {item.replyCount} {item.replyCount === 1 ? "reply" : "replies"}
        </span>
        <Link
          href={`/constellations/${item.constellation.slug}`}
          className="text-xs font-medium text-accent hover:underline"
        >
          View discussion &rarr;
        </Link>
      </div>
    </div>
  );
}
