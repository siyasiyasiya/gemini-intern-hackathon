"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Link as LinkIcon, LogOut, LogIn, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConstellationResponse } from "@/types/api";

const categoryColors: Record<string, string> = {
  politics: "bg-blue-500/20 text-blue-400",
  crypto: "bg-orange-500/20 text-orange-400",
  sports: "bg-green-500/20 text-green-400",
  entertainment: "bg-pink-500/20 text-pink-400",
  science: "bg-cyan-500/20 text-cyan-400",
  economics: "bg-yellow-500/20 text-yellow-400",
  technology: "bg-purple-500/20 text-purple-400",
  commodities: "bg-amber-500/20 text-amber-400",
  business: "bg-slate-500/20 text-slate-400",
  weather: "bg-sky-500/20 text-sky-400",
  media: "bg-rose-500/20 text-rose-400",
  culture: "bg-violet-500/20 text-violet-400",
  other: "bg-muted text-muted-foreground",
};

interface ConstellationHeaderProps {
  constellation: ConstellationResponse;
  isMember: boolean;
  userRole?: string | null;
  onMembershipChange: () => void;
}

export function ConstellationHeader({ constellation, isMember, userRole, onMembershipChange }: ConstellationHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleJoinLeave() {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isMember ? "leave" : "join";
      const res = await fetch(`/api/constellations/${constellation.slug}/${endpoint}`, { method: "POST" });
      const json = await res.json();
      if (!json.error) onMembershipChange();
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    try {
      const res = await fetch(`/api/constellations/${constellation.slug}/invite`, { method: "POST" });
      const json = await res.json();
      if (json.data?.inviteCode) {
        const url = `${window.location.origin}/api/constellations/join/${json.data.inviteCode}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  const canInvite = userRole === "owner" || userRole === "moderator";

  return (
    <div className="border-b border-border bg-card">
      {constellation.bannerUrl && (
        <div className="h-32 w-full overflow-hidden">
          <img src={constellation.bannerUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{constellation.name}</h1>
            {constellation.categories && constellation.categories.length > 0 ? (
              constellation.categories.map((cat: string) => (
                <span
                  key={cat}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    categoryColors[cat] || categoryColors.other
                  )}
                >
                  {cat}
                </span>
              ))
            ) : (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", categoryColors.other)}>
                General
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{constellation.memberCount}</span>
            </div>

            {canInvite && (
              <button
                onClick={handleInvite}
                className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <LinkIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Invite"}
              </button>
            )}

            {session && (
              <button
                onClick={handleJoinLeave}
                disabled={loading || userRole === "owner"}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                  isMember
                    ? "bg-secondary text-secondary-foreground hover:bg-destructive/20 hover:text-destructive"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isMember ? (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    Leave
                  </>
                ) : (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    Join
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {constellation.description && (
          <p className="mt-2 text-sm text-muted-foreground">{constellation.description}</p>
        )}
      </div>
    </div>
  );
}
