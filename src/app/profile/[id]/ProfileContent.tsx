"use client";

import { useQuery } from "@tanstack/react-query";
import {
  User,
  TrendingUp,
  Trophy,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn, formatCurrency, formatPercentage, timeAgo } from "@/lib/utils";
import type {
  ApiResponse,
  UserResponse,
  UserStatsResponse,
} from "@/types/api";

interface ProfileContentProps {
  userId: string;
}

export function ProfileContent({ userId }: ProfileContentProps) {
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      const json: ApiResponse<UserResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/stats`);
      const json: ApiResponse<UserStatsResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
    enabled: !!user,
  });

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
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Joined {timeAgo(new Date(user.createdAt))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Total P&L"
            value={
              <span
                className={cn(
                  stats.totalPnl >= 0 ? "text-yes-text" : "text-no-text"
                )}
              >
                {stats.totalPnl >= 0 ? "+" : ""}
                {formatCurrency(stats.totalPnl)}
              </span>
            }
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Win Rate"
            value={formatPercentage(stats.winRate)}
          />
          <StatCard
            icon={<User className="h-4 w-4" />}
            label="Trades"
            value={stats.totalTrades.toString()}
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Comments"
            value={stats.commentsPosted.toString()}
          />
        </div>
      )}

      {/* Trade Performance */}
      {stats && (stats.bestTrade !== 0 || stats.worstTrade !== 0) && (
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
                  +{formatCurrency(stats.bestTrade)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-no-text" />
              <div>
                <p className="text-xs text-muted-foreground">Worst Trade</p>
                <p className="text-sm font-medium text-no-text">
                  {formatCurrency(stats.worstTrade)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity */}
      {stats && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-sm font-medium text-foreground">Activity</h2>
          <p className="text-sm text-muted-foreground">
            Member of {stats.constellationsJoined} communit{stats.constellationsJoined !== 1 ? "ies" : "y"}{" "}
            &middot; {stats.commentsPosted} comment
            {stats.commentsPosted !== 1 && "s"} posted
          </p>
        </div>
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
