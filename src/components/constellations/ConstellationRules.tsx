"use client";

import type { ConstellationResponse } from "@/types/api";

export function ConstellationRules({ constellation }: { constellation: ConstellationResponse }) {
  if (!constellation.rules) return null;

  const rulesList = constellation.rules.split("\n").filter((r) => r.trim());

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
            <span className="text-foreground">{rule.trim().replace(/^\d+\.\s*/, "")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
