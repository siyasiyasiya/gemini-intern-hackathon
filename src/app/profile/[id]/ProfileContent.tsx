"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User,
  TrendingUp,
  Trophy,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { cn, formatCurrency, formatPercentage, timeAgo } from "@/lib/utils";
import { PositionsCard } from "@/components/profile/PositionsCard";
import { OrderHistoryCard } from "@/components/profile/OrderHistoryCard";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import type {
  ApiResponse,
  UserResponse,
  UserStatsResponse,
} from "@/types/api";

const topicColors: Record<string, string> = {
  politics: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  sports: "bg-green-500/20 text-green-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  science: "bg-cyan-500/20 text-cyan-400",
  economics: "bg-yellow-500/20 text-yellow-400",
  technology: "bg-purple-500/20 text-purple-400",
  other: "bg-muted text-muted-foreground",
};

interface ProfileContentProps {
  username: string;
}

export function ProfileContent({ username }: ProfileContentProps) {
  const { data: session } = useSession();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      const json: ApiResponse<UserResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
  });

  const isOwnProfile = session?.user?.id === user?.id;

  const { data: memberConstellations } = useQuery({
    queryKey: ["userConstellations", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/constellations`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as { id: string; name: string; slug: string; categories: string[] }[];
    },
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/stats`);
      const json: ApiResponse<UserStatsResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
    enabled: !!user,
  });

  const displayStats: UserStatsResponse = stats ?? {
    totalTrades: 0,
    totalPnl: 0,
    winRate: 0,
    constellationsJoined: 0,
    commentsPosted: 0,
    bestTrade: 0,
    worstTrade: 0,
  };

  if (userLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-destructive/20 bg-no-bg p-6 text-center text-sm text-destructive">
          User not found.
        </div>
      </div>
    );
  }

  const initials = (user.displayName || user.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* User Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              {user.displayName || user.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="mt-2 text-sm text-foreground-secondary">{user.bio}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Joined {timeAgo(new Date(user.createdAt))}
              </span>
              {stats?.dataSource === "gemini" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Gemini Connected
                </span>
              )}
              {stats?.dataSource === "local" && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                  Simulated Trades
                </span>
              )}
            </div>
            {isOwnProfile && !stats?.geminiConnected && !statsLoading && (
              <Link
                href="/settings"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Connect Gemini to show real stats
              </Link>
            )}
            {memberConstellations && memberConstellations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {memberConstellations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/constellations/${c.slug}`}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80",
                      topicColors[c.categories?.[0]] || topicColors.other
                    )}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {!statsLoading && stats?.dataSource && stats.dataSource !== "none" && (
        <p className="text-xs text-muted-foreground">
          Trading stats from{" "}
          {stats.dataSource === "gemini" ? (
            <span className="text-emerald-400">Gemini account</span>
          ) : (
            <span className="text-amber-400">simulated trades</span>
          )}
        </p>
      )}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="mt-2 h-5 w-16 rounded bg-muted" />
              <div className="mt-1 h-3 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Total P&L"
            value={
              <span
                className={cn(
                  displayStats.totalPnl >= 0 ? "text-yes-text" : "text-no-text"
                )}
              >
                {displayStats.totalPnl >= 0 ? "+" : ""}
                {formatCurrency(displayStats.totalPnl)}
              </span>
            }
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Win Rate"
            value={formatPercentage(displayStats.winRate)}
          />
          <StatCard
            icon={<User className="h-4 w-4" />}
            label="Trades"
            value={displayStats.totalTrades.toString()}
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Comments"
            value={displayStats.commentsPosted.toString()}
          />
        </div>
      )}

      {/* Trade Performance */}
      {(displayStats.bestTrade !== 0 || displayStats.worstTrade !== 0) && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-foreground">
            Trade Performance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-yes-text" />
              <div>
                <p className="text-xs text-muted-foreground">Best Trade</p>
                <p className="text-sm font-medium text-yes-text">
                  +{formatCurrency(displayStats.bestTrade)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-no-text" />
              <div>
                <p className="text-xs text-muted-foreground">Worst Trade</p>
                <p className="text-sm font-medium text-no-text">
                  {formatCurrency(displayStats.worstTrade)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <ActivityFeed username={username} />

      {/* Gemini Positions & Order History (own profile only) */}
      {isOwnProfile && stats?.geminiConnected && user && (
        <>
          <PositionsCard userId={user.id} />
          <OrderHistoryCard userId={user.id} />
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}</div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
