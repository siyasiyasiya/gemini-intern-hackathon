"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityResponse } from "@/types/api";

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

export function CommunityCard({ community }: { community: CommunityResponse }) {
  return (
    <Link href={`/communities/${community.slug}`}>
      <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
        {community.bannerUrl && (
          <div className="h-20 w-full overflow-hidden">
            <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
              {community.name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                topicColors[community.topic] || topicColors.other
              )}
            >
              {community.topic}
            </span>
          </div>
          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {community.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{community.memberCount} {community.memberCount === 1 ? "member" : "members"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
