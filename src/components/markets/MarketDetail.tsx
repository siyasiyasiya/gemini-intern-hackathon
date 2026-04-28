"use client";

import { useMarketDetail } from "@/hooks/useMarketDetail";
import { PriceChart } from "./PriceChart";
import { cn, formatCompactNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, BarChart3, ExternalLink, ArrowLeft } from "lucide-react";
import { ConsensusHeatmap } from "./ConsensusHeatmap";

function timeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

interface MarketDetailProps {
  ticker: string;
  constellationSlug?: string;
  onBack?: () => void;
  onSelectRelated?: (ticker: string) => void;
}

export function MarketDetail({ ticker, constellationSlug, onBack, onSelectRelated }: MarketDetailProps) {
  const { data: market, isLoading, error } = useMarketDetail(ticker);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-48 rounded bg-muted" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error?.message || "Market not found"}
      </div>
    );
  }

  const isPositive = market.changePercent24h >= 0;
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All markets
          </button>
        )}
        <div className="flex items-center gap-3 mb-2">
          {market.imageUrl ? (
            <img src={market.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground">{market.ticker.slice(0, 2)}</span>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground capitalize">{market.category}</p>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-yes-text" : "text-no-text"
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}
              {market.changePercent24h.toFixed(1)}% 24h
            </span>
          </div>
        </div>
        <h2 className="text-base font-semibold text-foreground leading-tight">{market.title}</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{market.description}</p>
      </div>

      {/* YES/NO buttons */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-yes-bg p-4 text-center">
          <div className="text-xs font-medium text-yes-text mb-1">Yes</div>
          <div className="text-2xl font-bold text-yes-text">{yesPercent}%</div>
        </div>
        <div className="rounded-xl bg-no-bg p-4 text-center">
          <div className="text-xs font-medium text-no-text mb-1">No</div>
          <div className="text-2xl font-bold text-no-text">{noPercent}%</div>
        </div>
      </div>

      {/* Price chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">Price History (30d)</h3>
        <PriceChart history={market.history} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary p-3 text-center">
          <BarChart3 className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <div className="text-[10px] text-muted-foreground">24h Vol</div>
          <div className="text-xs font-medium">${formatCompactNumber(market.volume24h)}</div>
        </div>
        <div className="rounded-xl bg-secondary p-3 text-center">
          <BarChart3 className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <div className="text-[10px] text-muted-foreground">Total Vol</div>
          <div className="text-xs font-medium">${formatCompactNumber(market.totalVolume)}</div>
        </div>
        <div className="rounded-xl bg-secondary p-3 text-center">
          <Clock className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
          <div className="text-[10px] text-muted-foreground">Resolves</div>
          <div className="text-xs font-medium">{timeLeft(market.resolutionDate)}</div>
        </div>
      </div>

      {/* Community consensus */}
      {constellationSlug && (
        <ConsensusHeatmap
          constellationSlug={constellationSlug}
          ticker={ticker}
          marketYesPrice={market.yesPrice}
        />
      )}

      {/* Resolution source */}
      <div className="rounded-xl bg-secondary p-3">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
          <ExternalLink className="h-3 w-3" /> Resolution Source
        </div>
        <div className="text-xs text-foreground">{market.resolutionSource}</div>
      </div>

      {/* Related markets */}
      {market.relatedTickers.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Related</h3>
          <div className="flex flex-wrap gap-1.5">
            {market.relatedTickers.map((t) => (
              <button
                key={t}
                onClick={() => onSelectRelated?.(t)}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
