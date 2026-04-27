"use client";

import { Calendar } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { ConstellationResponse } from "@/types/api";

export function ConstellationAbout({ constellation }: { constellation: ConstellationResponse }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
        About
      </h3>
      {constellation.about ? (
        <p className="text-sm text-foreground whitespace-pre-wrap">{constellation.about}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No description provided.</p>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        Created {timeAgo(new Date(constellation.createdAt))}
      </div>
    </div>
  );
}
