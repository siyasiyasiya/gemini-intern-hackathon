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

  if (isLoading || !data) return null;

  // Build display rows: top 5 + "N others" if needed
  const visible = data.outcomes.slice(0, MAX_VISIBLE_OUTCOMES);
  const rest = data.outcomes.slice(MAX_VISIBLE_OUTCOMES);
  const restAmount = rest.reduce((sum, o) => sum + o.amount, 0);
  const restPercent = rest.reduce((sum, o) => sum + o.percent, 0);
  const maxPercent = visible.length > 0 ? visible[0].percent : 1;

  // Map outcome labels to their chart colors
  const colorMap = new Map(outcomes.map((o) => [o.label, o.color || "#6b7280"]));

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <h3
          className="text-xs font-medium text-muted-foreground cursor-help"
          title="Based on positions shared in comments by constellation members. Weighted by position size."
        >
          Community Positions
        </h3>
      </div>

      <div className="space-y-2">
        {visible.map((o) => (
          <div key={o.label} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorMap.get(o.label) || "#6b7280" }}
                />
                {o.label}
              </span>
              <span className="font-medium text-foreground">{Math.round(o.percent * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(o.percent / maxPercent) * 100}%`,
                  backgroundColor: colorMap.get(o.label) || "#6b7280",
                }}
              />
            </div>
          </div>
        ))}

        {rest.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{rest.length} others</span>
              <span className="font-medium text-foreground">{Math.round(restPercent * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-muted-foreground/40 transition-all"
                style={{ width: `${(restPercent / maxPercent) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <span
        className="text-[10px] text-muted-foreground cursor-help block"
        title="Distinct members of this constellation who shared a position on this market in comments"
      >
        {data.totalPositions} position{data.totalPositions !== 1 ? "s" : ""} shared
      </span>
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
