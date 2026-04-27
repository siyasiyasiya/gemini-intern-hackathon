"use client";

import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency } from "@/lib/utils";
import type { GeminiPosition, GeminiSettledPosition } from "@/types/gemini";

interface PositionsCardProps {
  userId: string;
}

export function PositionsCard({ userId }: PositionsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["positions", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/positions`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as { active: GeminiPosition[]; settled: GeminiSettledPosition[] };
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-4 w-32 rounded bg-muted animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const active = data?.active ?? [];
  const settled = data?.settled ?? [];

  if (active.length === 0 && settled.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground mb-2">Positions</h2>
        <p className="text-sm text-muted-foreground">No positions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-foreground mb-4">Positions</h2>

      {active.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Active</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Market</th>
                  <th className="pb-2 pr-4">Side</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Avg Price</th>
                  <th className="pb-2 text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody>
                {active.map((p, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{p.symbol}</td>
                    <td className="py-2 pr-4">
                      <span className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                        p.outcome?.toLowerCase() === "yes"
                          ? "bg-yes-text/10 text-yes-text"
                          : "bg-no-text/10 text-no-text"
                      )}>
                        {p.outcome?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-foreground">{p.quantity}</td>
                    <td className="py-2 pr-4 text-right text-foreground">{formatCurrency(parseFloat(p.avgPrice || "0"))}</td>
                    <td className={cn(
                      "py-2 text-right font-medium",
                      parseFloat(p.realizedPl || "0") >= 0 ? "text-yes-text" : "text-no-text"
                    )}>
                      {parseFloat(p.realizedPl || "0") >= 0 ? "+" : ""}
                      {formatCurrency(parseFloat(p.realizedPl || "0"))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {settled.length > 0 && (
        <>
          <p className={cn("text-xs text-muted-foreground mb-2 uppercase tracking-wide", active.length > 0 && "mt-4")}>
            Settled
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Market</th>
                  <th className="pb-2 pr-4">Resolution</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Cost Basis</th>
                  <th className="pb-2 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {settled.map((p, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{p.symbol}</td>
                    <td className="py-2 pr-4">
                      <span className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                        p.resolutionSide?.toLowerCase() === "yes"
                          ? "bg-yes-text/10 text-yes-text"
                          : "bg-no-text/10 text-no-text"
                      )}>
                        {p.resolutionSide?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-foreground">{p.quantity}</td>
                    <td className="py-2 pr-4 text-right text-foreground">{formatCurrency(parseFloat(p.costBasis || "0"))}</td>
                    <td className={cn(
                      "py-2 text-right font-medium",
                      parseFloat(p.netProfit || "0") >= 0 ? "text-yes-text" : "text-no-text"
                    )}>
                      {parseFloat(p.netProfit || "0") >= 0 ? "+" : ""}
                      {formatCurrency(parseFloat(p.netProfit || "0"))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
