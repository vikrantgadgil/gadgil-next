import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { urduCharacters } from "@/lib/db/schema/urdu-characters";
import { URDU_CHARACTERS } from "@/lib/data/urdu-characters";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("🌱 Seeding Urdu characters...");

  // Clear existing data
  await db.delete(urduCharacters);
  console.log("  ✓ Cleared existing characters");

  // Insert all characters
  const values = URDU_CHARACTERS.map((c) => ({
    id: c.id,
    character: c.character,
    name: c.name,
    forms: c.forms,
    examples: c.examples,
  }));

  await db.insert(urduCharacters).values(values);
  console.log(`  ✓ Inserted ${values.length} characters`);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
