"use client";

import { useConsensus, useCategoricalConsensus } from "@/hooks/useConsensus";
import { Users } from "lucide-react";
import type { ContractSummary } from "@/types/market";

interface ConsensusHeatmapProps {
  constellationSlug: string;
  ticker: string;
  marketYesPrice: number;
  outcomes?: ContractSummary[];
}

function DivergenceLabel({ divergence }: { divergence: number }) {
  const abs = Math.abs(divergence);
  const pct = Math.round(abs * 100);
  const sign = divergence >= 0 ? "+" : "-";

  if (abs >= 0.15) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 cursor-help"
        title={`Community consensus is ${pct} points ${divergence < 0 ? "below" : "above"} the market price — a contrarian signal`}
      >
        CONTRARIAN {sign}{pct}%
      </span>
    );
  }
  if (abs >= 0.05) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400 cursor-help"
        title={`Community consensus is ${pct} points ${divergence < 0 ? "below" : "above"} the market price`}
      >
        LEANING {sign}{pct}%
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400 cursor-help"
      title="Community consensus is within 5 points of the market price"
    >
      ALIGNED
    </span>
  );
}

const MAX_VISIBLE_OUTCOMES = 5;
const MIN_POSITIONS = 3;

function CategoricalConsensus({
  constellationSlug,
  ticker,
  outcomes,
}: {
  constellationSlug: string;
  ticker: string;
  outcomes: ContractSummary[];
}) {
  const { data, isLoading } = useCategoricalConsensus(constellationSlug, ticker, true);

  if (isLoading) return null;

  if (!data || data.outcomes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium text-muted-foreground">Community Consensus</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          No positions shared yet. Share your position in a comment to contribute.
        </p>
      </div>
    );
  }

  // Low-N gate: don't show percentages with < 3 positions
  if (data.totalPositions < MIN_POSITIONS) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium text-muted-foreground">Community Consensus</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {data.totalPositions} of {MIN_POSITIONS} positions needed. Share yours to unlock community consensus.
        </p>
      </div>
    );
  }

  // Map outcome labels to market prices and colors
  const marketPriceMap = new Map(outcomes.map((o) => [o.label, o.yesPrice]));
  const colorMap = new Map(outcomes.map((o) => [o.label, o.color || "#6b7280"]));

  // Build rows with community vs market comparison
  const visible = data.outcomes.slice(0, MAX_VISIBLE_OUTCOMES);
  const rest = data.outcomes.slice(MAX_VISIBLE_OUTCOMES);
  const restPercent = rest.reduce((sum, o) => sum + o.percent, 0);

  // Find the outcome with the biggest divergence for the summary label
  let biggestDivergence = 0;
  let biggestDivergenceLabel = "";
  for (const o of data.outcomes) {
    const marketPrice = marketPriceMap.get(o.label) ?? 0;
    const div = o.percent - marketPrice;
    if (Math.abs(div) > Math.abs(biggestDivergence)) {
      biggestDivergence = div;
      biggestDivergenceLabel = o.label;
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <h3
          className="text-xs font-medium text-muted-foreground cursor-help"
          title="Community positions vs market prices. Based on positions shared in comments by constellation members."
        >
          Community Consensus
        </h3>
      </div>

      <div className="space-y-3">
        {visible.map((o) => {
          const marketPrice = marketPriceMap.get(o.label) ?? 0;
          const communityPct = Math.round(o.percent * 100);
          const marketPct = Math.round(marketPrice * 100);
          const color = colorMap.get(o.label) || "#6b7280";

          return (
            <div key={o.label} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {o.label}
                </span>
              </div>
              {/* Community bar */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-14 text-right">Community</span>
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${communityPct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground w-8 text-right">{communityPct}%</span>
              </div>
              {/* Market bar */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-14 text-right">Market</span>
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/40 transition-all"
                    style={{ width: `${marketPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{marketPct}¢</span>
              </div>
            </div>
          );
        })}

        {rest.length > 0 && (
          <div className="text-[10px] text-muted-foreground">
            +{rest.length} others ({Math.round(restPercent * 100)}% of community positions)
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className="cursor-help"
          title={`Biggest gap: ${biggestDivergenceLabel} (community vs market)`}
        >
          <DivergenceLabel divergence={biggestDivergence} />
        </span>
        <span
          className="text-[10px] text-muted-foreground cursor-help"
          title="Distinct members of this constellation who shared a position on this market in comments"
        >
          {data.totalPositions} position{data.totalPositions !== 1 ? "s" : ""} shared
        </span>
      </div>
    </div>
  );
}

function BinaryConsensus({
  constellationSlug,
  ticker,
  marketYesPrice,
}: {
  constellationSlug: string;
  ticker: string;
  marketYesPrice: number;
}) {
  const { data, isLoading } = useConsensus(constellationSlug, ticker);

  if (isLoading || !data) return null;

  const communityPct = Math.round(data.consensusPercent * 100);
  const marketPct = Math.round(marketYesPrice * 100);
  const divergence = data.consensusPercent - marketYesPrice;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <h3
          className="text-xs font-medium text-muted-foreground cursor-help"
          title="Weighted by position size (volume), not headcount. Only includes current constellation members."
        >
          Community Consensus (by volume)
        </h3>
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
        <span
          className="text-[10px] text-muted-foreground cursor-help"
          title="Distinct members of this constellation who hold at least one position on this market"
        >
          {data.totalPositions} member{data.totalPositions !== 1 ? "s" : ""} positioned
        </span>
      </div>
    </div>
  );
}

export function ConsensusHeatmap({ constellationSlug, ticker, marketYesPrice, outcomes }: ConsensusHeatmapProps) {
  const isCategorical = outcomes && outcomes.length > 1;

  if (isCategorical) {
    return (
      <CategoricalConsensus
        constellationSlug={constellationSlug}
        ticker={ticker}
        outcomes={outcomes}
      />
    );
  }

  return (
    <BinaryConsensus
      constellationSlug={constellationSlug}
      ticker={ticker}
      marketYesPrice={marketYesPrice}
    />
  );
}
