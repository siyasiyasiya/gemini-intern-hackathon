"use client";

import { useConsensus } from "@/hooks/useConsensus";
import { Users } from "lucide-react";

interface ConsensusHeatmapProps {
  constellationSlug: string;
  ticker: string;
  marketYesPrice: number;
}

function DivergenceLabel({ divergence }: { divergence: number }) {
  const abs = Math.abs(divergence);
  const pct = Math.round(abs * 100);
  const sign = divergence >= 0 ? "+" : "-";

  if (abs >= 0.15) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        CONTRARIAN {sign}{pct}%
      </span>
    );
  }
  if (abs >= 0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
        LEANING {sign}{pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
      ALIGNED
    </span>
  );
}

export function ConsensusHeatmap({ constellationSlug, ticker, marketYesPrice }: ConsensusHeatmapProps) {
  const { data, isLoading } = useConsensus(constellationSlug, ticker);

  if (isLoading || !data) return null;

  const communityPct = Math.round(data.consensusPercent * 100);
  const marketPct = Math.round(marketYesPrice * 100);
  const divergence = data.consensusPercent - marketYesPrice;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground">Community Consensus</h3>
      </div>

      {/* Community bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Community</span>
          <span className="font-medium text-yes-text">{communityPct}% YES</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-yes-text transition-all"
            style={{ width: `${communityPct}%` }}
          />
        </div>
      </div>

      {/* Market bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Market</span>
          <span className="font-medium text-muted-foreground">{marketPct}¢</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all"
            style={{ width: `${marketPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <DivergenceLabel divergence={divergence} />
        <span className="text-[10px] text-muted-foreground">
          {data.totalPositions} member{data.totalPositions !== 1 ? "s" : ""} positioned
        </span>
      </div>
    </div>
  );
}
