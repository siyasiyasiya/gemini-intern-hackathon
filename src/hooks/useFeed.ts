import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItemResponse } from "@/types/api";

interface FeedPage {
  data: FeedItemResponse[];
  nextCursor: string | null;
}

export function useFeed(sort: "latest" | "trending") {
  return useInfiniteQuery<FeedPage>({
    queryKey: ["feed", sort],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ sort });
      if (pageParam) params.set("cursor", pageParam as string);
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
