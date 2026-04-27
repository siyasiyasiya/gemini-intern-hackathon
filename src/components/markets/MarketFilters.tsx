"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { MarketCategory, MarketSortOption } from "@/types/market";

const CATEGORIES: { value: MarketCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "politics", label: "Politics" },
  { value: "crypto", label: "Crypto" },
  { value: "sports", label: "Sports" },
  { value: "economics", label: "Economics" },
  { value: "technology", label: "Technology" },
  { value: "science", label: "Science" },
  { value: "entertainment", label: "Entertainment" },
];

const SORT_OPTIONS: { value: MarketSortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "resolving_soon", label: "Resolving Soon" },
  { value: "newest", label: "Newest" },
  { value: "biggest_movers", label: "Biggest Movers" },
  { value: "volume", label: "Volume" },
];

interface MarketFiltersProps {
  category?: MarketCategory;
  sort?: MarketSortOption;
  search?: string;
  onCategoryChange: (category: MarketCategory | undefined) => void;
  onSortChange: (sort: MarketSortOption) => void;
  onSearchChange: (search: string) => void;
}

export function MarketFilters({
  category,
  sort = "trending",
  search = "",
  onCategoryChange,
  onSortChange,
  onSearchChange,
}: MarketFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search markets..."
          className="w-full rounded-md border border-border bg-secondary pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                onCategoryChange(cat.value === "all" ? undefined : cat.value)
              }
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                (cat.value === "all" && !category) || cat.value === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as MarketSortOption)}
          className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
