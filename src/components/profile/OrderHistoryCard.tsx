"use client";

import { useQuery } from "@tanstack/react-query";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import type { GeminiOrder } from "@/types/gemini";

interface OrderHistoryCardProps {
  userId: string;
}

export function OrderHistoryCard({ userId }: OrderHistoryCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["orderHistory", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/order-history`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as GeminiOrder[];
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

  const orders = data ?? [];

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground mb-2">Order History</h2>
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-foreground mb-4">Order History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4">Market</th>
              <th className="pb-2 pr-4">Side</th>
              <th className="pb-2 pr-4 text-right">Qty</th>
              <th className="pb-2 pr-4 text-right">Price</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">{o.symbol}</td>
                <td className="py-2 pr-4">
                  <span className={cn(
                    "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                    o.outcome?.toLowerCase() === "yes"
                      ? "bg-yes-text/10 text-yes-text"
                      : "bg-no-text/10 text-no-text"
                  )}>
                    {o.side?.toUpperCase() || "—"} {o.outcome?.toUpperCase() || ""}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right text-foreground">
                  {o.filledQuantity || o.quantity}
                </td>
                <td className="py-2 pr-4 text-right text-foreground">
                  {formatCurrency(parseFloat(o.price || "0"))}
                </td>
                <td className="py-2 pr-4">
                  <span className={cn(
                    "text-xs",
                    o.status === "closed" ? "text-yes-text" : "text-muted-foreground"
                  )}>
                    {o.status}
                  </span>
                </td>
                <td className="py-2 text-right text-xs text-muted-foreground">
                  {o.createdAt ? timeAgo(new Date(o.createdAt)) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
