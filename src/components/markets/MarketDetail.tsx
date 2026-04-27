"use client";

import { useMarketDetail } from "@/hooks/useMarketDetail";
import { PriceChart } from "./PriceChart";
import { cn, formatCompactNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, BarChart3, ExternalLink, ArrowLeft } from "lucide-react";

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
  onBack?: () => void;
  onSelectRelated?: (ticker: string) => void;
}

export function MarketDetail({ ticker, onBack, onSelectRelated }: MarketDetailProps) {
  const { data: market, isLoading, error } = useMarketDetail(ticker);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-secondary" />
        <div className="h-4 w-full rounded bg-secondary" />
        <div className="h-4 w-2/3 rounded bg-secondary" />
        <div className="h-48 rounded bg-secondary" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error?.message || "Market not found"}
      </div>
    );
  }

  const isPositive = market.changePercent24h >= 0;
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to markets
          </button>
        )}
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
            {market.ticker}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}
            {market.changePercent24h.toFixed(1)}%
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">{market.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{market.description}</p>
      </div>

      {/* Large YES/NO display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
          <div className="text-xs font-medium text-success mb-1">YES</div>
          <div className="text-3xl font-bold text-success">{yesPercent}%</div>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
          <div className="text-xs font-medium text-destructive mb-1">NO</div>
          <div className="text-3xl font-bold text-destructive">{noPercent}%</div>
        </div>
      </div>

      {/* Price chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Price History (30d)</h3>
        <PriceChart history={market.history} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <BarChart3 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <div className="text-xs text-muted-foreground">24h Volume</div>
          <div className="text-sm font-medium">${formatCompactNumber(market.volume24h)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <BarChart3 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <div className="text-xs text-muted-foreground">Total Volume</div>
          <div className="text-sm font-medium">${formatCompactNumber(market.totalVolume)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <div className="text-xs text-muted-foreground">Resolves</div>
          <div className="text-sm font-medium">{timeLeft(market.resolutionDate)}</div>
        </div>
      </div>

      {/* Resolution source */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <ExternalLink className="h-3 w-3" /> Resolution Source
        </div>
        <div className="text-sm text-foreground">{market.resolutionSource}</div>
      </div>

      {/* Related markets */}
      {market.relatedTickers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Related Markets</h3>
          <div className="flex flex-wrap gap-2">
            {market.relatedTickers.map((t) => (
              <button
                key={t}
                onClick={() => onSelectRelated?.(t)}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
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
