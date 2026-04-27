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
            <div className="h-16 w-16 rounded-full bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-lg font-semibold text-zinc-300">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-zinc-100">
              {user.displayName || user.username}
            </h1>
            <p className="text-sm text-zinc-500">@{user.username}</p>
            {user.bio && (
              <p className="mt-2 text-sm text-zinc-400">{user.bio}</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
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
                  stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Trade Performance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-zinc-500">Best Trade</p>
                <p className="text-sm font-medium text-emerald-400">
                  +{formatCurrency(stats.bestTrade)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-xs text-zinc-500">Worst Trade</p>
                <p className="text-sm font-medium text-red-400">
                  {formatCurrency(stats.worstTrade)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rooms & Activity */}
      {stats && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Activity</h2>
          <p className="text-sm text-zinc-500">
            Member of {stats.communitiesJoined} communit{stats.communitiesJoined !== 1 ? "ies" : "y"}{" "}
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 text-zinc-500">{icon}</div>
      <p className="mt-2 text-lg font-semibold text-zinc-200">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
