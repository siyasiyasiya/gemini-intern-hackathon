import { Suspense } from "react";
import { ProfileContent } from "./ProfileContent";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent userId={id} />
    </Suspense>
  );
}

function ProfileSkeleton() {
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
