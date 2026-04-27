"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Plus } from "lucide-react";
import { RoomList } from "@/components/rooms/RoomList";

export default function RoomsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-2xl font-bold">Browse Rooms</h1>
        {session && (
          <button
            onClick={() => router.push("/rooms/create")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Room
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="w-full rounded-lg border border-border bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      <RoomList search={query} />
    </main>
  );
}
