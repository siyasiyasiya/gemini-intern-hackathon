"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const roleConfig: Record<string, { icon: typeof Crown; label: string; color: string }> = {
  owner: { icon: Crown, label: "Owner", color: "text-yellow-400" },
  moderator: { icon: Shield, label: "Mod", color: "text-blue-400" },
  member: { icon: User, label: "Member", color: "text-muted-foreground" },
};

export function MemberList({ communitySlug }: { communitySlug: string }) {
  const { data } = useQuery({
    queryKey: ["community-members", communitySlug],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communitySlug}/members`);
      return res.json();
    },
  });

  const members: Member[] = data?.data || [];
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, moderator: 1, member: 2 };
    return (order[a.role as keyof typeof order] ?? 2) - (order[b.role as keyof typeof order] ?? 2);
  });

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
        Members ({members.length})
      </h3>
      <div className="space-y-1">
        {sorted.map((member) => {
          const config = roleConfig[member.role] || roleConfig.member;
          const Icon = config.icon;
          return (
            <div
              key={member.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary/50 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0">
                {(member.displayName || member.username).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm truncate flex-1">
                {member.displayName || member.username}
              </span>
              <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
