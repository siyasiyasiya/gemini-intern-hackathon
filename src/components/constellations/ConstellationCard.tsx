"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConstellationResponse } from "@/types/api";

const categoryColors: Record<string, string> = {
  politics: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  sports: "bg-green-500/20 text-green-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  science: "bg-cyan-500/20 text-cyan-400",
  economics: "bg-yellow-500/20 text-yellow-400",
  technology: "bg-purple-500/20 text-purple-400",
  commodities: "bg-amber-500/20 text-amber-400",
  business: "bg-slate-500/20 text-slate-400",
  weather: "bg-sky-500/20 text-sky-400",
  media: "bg-rose-500/20 text-rose-400",
  culture: "bg-violet-500/20 text-violet-400",
  other: "bg-muted text-muted-foreground",
};

export function ConstellationCard({ constellation }: { constellation: ConstellationResponse }) {
  return (
    <Link href={`/constellations/${constellation.slug}`}>
      <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5">
        {constellation.bannerUrl && (
          <div className="h-20 w-full overflow-hidden">
            <img src={constellation.bannerUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {constellation.name}
            </h3>
            <div className="flex flex-wrap gap-1 shrink-0">
              {constellation.categories && constellation.categories.length > 0 ? (
                constellation.categories.slice(0, 3).map((cat: string) => (
                  <span
                    key={cat}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      categoryColors[cat] || categoryColors.other
                    )}
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors.other)}>
                  General
                </span>
              )}
            </div>
          </div>
          {constellation.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {constellation.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{constellation.memberCount} {constellation.memberCount === 1 ? "member" : "members"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
