import { useInfiniteQuery } from "@tanstack/react-query";
import type { ActivityItemResponse } from "@/types/api";

export type ActivityTab = "posts" | "replies" | "likes";

interface ActivityPage {
  data: ActivityItemResponse[];
  nextCursor: string | null;
}

export function useUserActivity(username: string, tab: ActivityTab) {
  return useInfiniteQuery<ActivityPage>({
    queryKey: ["userActivity", username, tab],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ tab });
      if (pageParam) params.set("cursor", pageParam as string);
      const res = await fetch(`/api/users/${username}/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
