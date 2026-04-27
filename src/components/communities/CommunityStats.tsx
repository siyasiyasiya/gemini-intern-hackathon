"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Target, DollarSign, Users } from "lucide-react";
import { formatPercentage, formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { ApiResponse, CommunityStatsResponse } from "@/types/api";

export function CommunityStats({ communitySlug }: { communitySlug: string }) {
  const { data: stats } = useQuery({
    queryKey: ["community-stats", communitySlug],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communitySlug}/stats`);
      const json: ApiResponse<CommunityStatsResponse> = await res.json();
      return json.data;
    },
  });

  if (!stats) return null;

  const items = [
    { icon: Target, label: "Accuracy", value: formatPercentage(stats.collectiveAccuracy) },
    { icon: DollarSign, label: "Volume", value: formatCurrency(stats.totalVolume) },
    { icon: BarChart3, label: "Trades", value: formatCompactNumber(stats.totalTrades) },
    { icon: Users, label: "Active", value: String(stats.activeMemberCount) },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
        Community Stats
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <item.icon className="h-3.5 w-3.5" />
              <span className="text-xs">{item.label}</span>
            </div>
            <p className="text-sm font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
