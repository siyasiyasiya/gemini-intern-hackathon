import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const DEMO_EMAIL = "demo@predictions.dev";
const DEMO_PASSWORD = "demo1234";
const DEMO_USERNAME = "demo_user";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Seeding demo account...");

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_EMAIL))
    .limit(1);

  if (existing) {
    console.log("Demo account already exists:", DEMO_EMAIL);
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const [user] = await db
      .insert(schema.users)
      .values({
        username: DEMO_USERNAME,
        email: DEMO_EMAIL,
        passwordHash,
        displayName: "Demo User",
        bio: "Hackathon demo account",
      })
      .returning();

    console.log("Created demo account:", user.email);
  }

  console.log("\nDemo credentials:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
