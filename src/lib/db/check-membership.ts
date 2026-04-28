import { db } from "@/lib/db";
import { constellations, constellationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Look up a constellation by slug and optionally check membership.
 * For private constellations, returns `forbidden: true` if the user is not a member.
 */
export async function checkConstellationAccess(
  slug: string,
  userId: string | null | undefined
) {
  const [constellation] = await db
    .select({
      id: constellations.id,
      isPublic: constellations.isPublic,
    })
    .from(constellations)
    .where(eq(constellations.slug, slug))
    .limit(1);

  if (!constellation) {
    return { constellation: null, isMember: false, forbidden: false } as const;
  }

  let isMember = false;
  if (userId) {
    const [membership] = await db
      .select({ id: constellationMembers.id })
      .from(constellationMembers)
      .where(
        and(
          eq(constellationMembers.constellationId, constellation.id),
          eq(constellationMembers.userId, userId)
        )
      )
      .limit(1);
    isMember = !!membership;
  }

  const forbidden = !constellation.isPublic && !isMember;

  return { constellation, isMember, forbidden } as const;
}
