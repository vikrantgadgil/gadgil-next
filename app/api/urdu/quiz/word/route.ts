import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduWordCache } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { UrduWordBank } from "@/lib/urdu/words";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excluded = new Set(
    excludeParam.split(",").filter(Boolean).map((s) => s.toLowerCase())
  );

  const candidates = UrduWordBank.filter(
    (w) => !excluded.has(w.roman.toLowerCase())
  );
  const pool = candidates.length > 0 ? candidates : UrduWordBank;
  const word = pool[Math.floor(Math.random() * pool.length)];

  const question_type = word.roman.length <= 4 ? "meaning" : "spelling";
  const correct_answer =
    question_type === "meaning"
      ? word.meaning.toLowerCase()
      : word.roman.toLowerCase();

  const [cached] = await db
    .select()
    .from(urduWordCache)
    .where(sql`lower(${urduWordCache.roman}) = ${word.roman.toLowerCase()}`)
    .limit(1);

  return Response.json({
    roman: word.roman,
    urdu_script: word.urdu_script,
    meaning: word.meaning,
    question_type,
    correct_answer,
    from_cache: !!cached,
  });
}
