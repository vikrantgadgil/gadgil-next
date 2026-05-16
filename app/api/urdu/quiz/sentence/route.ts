import { auth } from "@/auth";
import { UrduSentenceBank } from "@/lib/urdu/sentences";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excluded = new Set(
    excludeParam.split(",").filter(Boolean).map((s) => s.trim())
  );

  const candidates = UrduSentenceBank.filter(
    (s) => !excluded.has(s.id)
  );
  const pool = candidates.length > 0 ? candidates : UrduSentenceBank;
  const sentence = pool[Math.floor(Math.random() * pool.length)];

  // Return sentence data without the correct answer (for the quiz)
  return Response.json({
    id: sentence.id,
    urdu: sentence.urdu,
    difficulty: sentence.difficulty,
    words: sentence.words.map((w) => ({
      urdu: w.urdu,
      roman_primary: w.roman_primary,
      roman_accepted_variants: w.roman_accepted_variants,
      english_meaning: w.english_meaning,
      components: w.components ?? null,
    })),
  });
}
