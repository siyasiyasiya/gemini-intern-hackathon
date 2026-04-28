"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Comment } from "@/components/comments/Comment";
import { useUserActivity, type ActivityTab } from "@/hooks/useUserActivity";
import type { ActivityItemResponse } from "@/types/api";

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

const tabs: { key: ActivityTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "replies", label: "Replies" },
  { key: "likes", label: "Likes" },
];

interface ActivityFeedProps {
  username: string;
}

export function ActivityFeed({ username }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>("posts");
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserActivity(username, activeTab);

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-12 rounded bg-muted" />
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && items.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {activeTab === "posts" && "No posts yet."}
          {activeTab === "replies" && "No replies yet."}
          {activeTab === "likes" && "No liked posts yet."}
        </div>
      )}

      {/* Activity items */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <ActivityItem key={item.id} item={item} tab={activeTab} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityItem({
  item,
  tab,
}: {
  item: ActivityItemResponse;
  tab: ActivityTab;
}) {
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
      </div>

      {/* Reply context */}
      {tab === "replies" && item.parentComment && (
        <div className="mx-4 mb-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Replying to{" "}
          <span className="font-medium text-foreground">
            @{item.parentComment.username}
          </span>
          : {item.parentComment.content}
        </div>
      )}

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
