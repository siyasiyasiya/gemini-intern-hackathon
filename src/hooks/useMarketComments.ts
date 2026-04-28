import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItemResponse } from "@/types/api";

interface MarketCommentsPage {
  data: FeedItemResponse[];
  nextCursor: string | null;
}

export function useMarketComments(ticker: string, sort: "latest" | "trending") {
  return useInfiniteQuery<MarketCommentsPage>({
    queryKey: ["market-comments", ticker, sort],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ sort });
      if (pageParam) params.set("cursor", pageParam as string);
      const res = await fetch(`/api/markets/${encodeURIComponent(ticker)}/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch market comments");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
