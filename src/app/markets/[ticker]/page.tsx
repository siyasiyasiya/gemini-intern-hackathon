"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { MarketDetail } from "@/components/markets/MarketDetail";
import { MarketCommentList } from "@/components/markets/MarketCommentList";
import { AutopsyTimeline } from "@/components/markets/AutopsyTimeline";

export default function MarketPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const router = useRouter();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Market detail */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <MarketDetail
              ticker={ticker}
              onSelectRelated={(t) => router.push(`/markets/${encodeURIComponent(t)}`)}
            />
          </div>
        </div>

        {/* Cross-constellation comments */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Community Discussion
          </h2>
          <MarketCommentList ticker={ticker} />
        </div>

        {/* Autopsy timeline */}
        <div className="lg:w-[420px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Market Autopsy
            </h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <AutopsyTimeline ticker={ticker} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
