"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateCommunityForm } from "@/components/communities/CreateCommunityForm";
import { useEffect } from "react";

export default function CreateCommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/communities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Communities
      </Link>

      <h1 className="text-2xl font-bold mb-8">Create a Community</h1>
      <CreateCommunityForm />
    </main>
  );
}
