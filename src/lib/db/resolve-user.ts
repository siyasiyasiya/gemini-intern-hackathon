import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a user ID or username to a user row.
 * Returns the user's id + geminiApiKeyEnc, or null if not found.
 */
export async function resolveUser(idOrUsername: string) {
  const isUuid = UUID_REGEX.test(idOrUsername);
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      geminiApiKeyEnc: users.geminiApiKeyEnc,
    })
    .from(users)
    .where(isUuid ? eq(users.id, idOrUsername) : eq(users.username, idOrUsername))
    .limit(1);
  return user ?? null;
}
