"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, TrendingUp } from "lucide-react";
import { RoomCard } from "@/components/rooms/RoomCard";
import type { RoomResponse } from "@/types/api";

export default function Home() {
  const { data: session } = useSession();
  const { data } = useQuery({
    queryKey: ["trending-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/rooms?page=1");
      return res.json();
    },
  });

  const rooms: RoomResponse[] = data?.data?.slice(0, 6) || [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
          <TrendingUp className="h-4 w-4" />
          Prediction Markets + Community
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Predictions Communities
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Join rooms built around real prediction markets. Discuss, trade, and compete
          with others who share your interests.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/rooms"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse Rooms
          </Link>
          {session ? (
            <Link
              href="/rooms/create"
              className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create a Room
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Trending Rooms */}
      {rooms.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Trending Rooms</h2>
            <Link
              href="/rooms"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
