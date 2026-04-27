"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { CommunityCard } from "@/components/communities/CommunityCard";
import type { CommunityResponse } from "@/types/api";

export default function Home() {
  const { data: session } = useSession();
  const { data } = useQuery({
    queryKey: ["trending-communities"],
    queryFn: async () => {
      const res = await fetch("/api/communities?page=1");
      return res.json();
    },
  });

  const communities: CommunityResponse[] = data?.data?.slice(0, 6) || [];

  return (
    <main className="mx-auto max-w-6xl px-4 lg:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-bg border border-accent/20 px-4 py-1.5 text-sm text-accent mb-8">
          Prediction Markets + Community
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5">
          Predictions Communities
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Join communities built around real prediction markets. Discuss, trade, and compete
          with others who share your interests.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/communities"
            className="rounded-full bg-primary px-7 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Browse Communities
          </Link>
          {session ? (
            <Link
              href="/communities/create"
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-border bg-secondary px-6 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Trending Communities */}
      {communities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Trending Communities</h2>
            <Link
              href="/communities"
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
