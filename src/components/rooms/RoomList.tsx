"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoomCard } from "./RoomCard";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomResponse } from "@/types/api";

const topics = [
  "all",
  "politics",
  "crypto",
  "sports",
  "entertainment",
  "science",
  "economics",
  "technology",
  "other",
] as const;

async function fetchRooms(topic: string, search: string, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (topic !== "all") params.set("topic", topic);
  if (search) params.set("search", search);
  const res = await fetch(`/api/rooms?${params}`);
  return res.json();
}

export function RoomList({ search = "" }: { search?: string }) {
  const [topic, setTopic] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", topic, search, page],
    queryFn: () => fetchRooms(topic, search, page),
  });

  const rooms: RoomResponse[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.pageSize || 12));

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => { setTopic(t); setPage(1); }}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              topic === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No rooms found. Create one to get started!
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-4 py-2 text-sm bg-secondary text-secondary-foreground disabled:opacity-50 hover:bg-secondary/80"
              >
                Previous
              </button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-4 py-2 text-sm bg-secondary text-secondary-foreground disabled:opacity-50 hover:bg-secondary/80"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
