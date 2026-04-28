"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, CheckCircle2, XCircle, Loader2, User } from "lucide-react";
import type { ApiResponse, UserResponse } from "@/types/api";

export function SettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const { data: geminiStatus, isLoading } = useQuery({
    queryKey: ["geminiStatus"],
    queryFn: async () => {
      const res = await fetch("/api/settings/gemini");
      const json = await res.json();
      return json.data as { connected: boolean };
    },
    enabled: !!session,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiSecret }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      setApiKey("");
      setApiSecret("");
      queryClient.invalidateQueries({ queryKey: ["geminiStatus"] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/gemini", { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geminiStatus"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });

  const username = (session?.user as Record<string, unknown>)?.username as string | undefined;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      const json: ApiResponse<UserResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
    enabled: !!username,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });
      const json: ApiResponse<UserResponse> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", username] });
    },
  });

  const connected = geminiStatus?.connected ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      </div>

      {/* Profile Info */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Update your display name, bio, and avatar.
        </p>

        {profileLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={username ?? "Display name"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {profileMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {profileMutation.error.message}
              </div>
            )}

            {profileMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Profile updated
              </div>
            )}

            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {profileMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Gemini Connection */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-medium text-foreground">
          Connect Gemini Account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link your Gemini API key to display real trading stats on your profile.
        </p>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection...
          </div>
        ) : connected ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Gemini account connected
            </div>
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectMutation.mutate();
            }}
            className="mt-4 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                API Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your Gemini API secret"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            {connectMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {connectMutation.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={connectMutation.isPending || !apiKey || !apiSecret}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {connectMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </span>
              ) : (
                "Connect"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
