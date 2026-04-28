"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { FeedList } from "@/components/feed/FeedList";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-lg font-semibold text-foreground mb-4">Your Feed</h1>
      <FeedList />
    </div>
  );
}
