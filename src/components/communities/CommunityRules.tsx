"use client";

import type { CommunityResponse } from "@/types/api";

export function CommunityRules({ community }: { community: CommunityResponse }) {
  if (!community.rules) return null;

  const rulesList = community.rules.split("\n").filter((r) => r.trim());

  if (rulesList.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
        Rules
      </h3>
      <ol className="space-y-2">
        {rulesList.map((rule, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className="shrink-0 text-muted-foreground font-medium">{i + 1}.</span>
            <span className="text-foreground">{rule.trim()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
