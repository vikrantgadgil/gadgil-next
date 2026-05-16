import { auth } from "@/auth";
import { UrduSentenceBank } from "@/lib/urdu/sentences";
import { generateUrduSentenceQuiz, type Topic } from "@/lib/urdu/generate-sentence";

/**
 * GET /api/urdu/quiz/sentence
 *
 * Generates a sentence quiz question.
 * Primary: Uses DeepSeek AI to generate a fresh sentence.
 * Fallback: Uses the local sentence bank if AI is unavailable.
 *
 * Query params:
 *   - exclude: comma-separated sentence IDs/urdu texts to exclude
 *   - difficulty: "beginner" | "easy" | "medium" (default: "beginner")
 *   - topic: topic string or "random" (default: "random")
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const difficultyParam = searchParams.get("difficulty") ?? "beginner";
  const topicParam = searchParams.get("topic") ?? "random";

  const difficulty = ["beginner", "easy", "medium"].includes(difficultyParam)
    ? (difficultyParam as "beginner" | "easy" | "medium")
    : "beginner";

  const topic = topicParam as Topic;

  // Parse excluded items — these can be sentence IDs or Urdu text
  const excluded = new Set(
    excludeParam.split(",").filter(Boolean).map((s) => s.trim())
  );

  // Try AI generation first (with retry for duplicates)
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const generated = await generateUrduSentenceQuiz(
      difficulty,
      topic,
      Array.from(excluded)
    );

    if (generated) {
      // Check for duplicates against excluded list
      const normalizedUrdu = generated.urdu.replace(/\s+/g, " ").trim();
      const normalizedRoman = generated.roman_primary
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const isDuplicate = excluded.has(normalizedUrdu) || excluded.has(normalizedRoman);

      if (!isDuplicate) {
        // Convert to the same format as the local bank for consistency
        const id = `ai-${Date.now()}-${attempts}`;

        return Response.json({
          id,
          urdu: generated.urdu,
          roman_primary: generated.roman_primary,
          roman_accepted_variants: generated.roman_accepted_variants,
          difficulty: generated.difficulty,
          words: generated.words.map((w) => ({
            urdu: w.urdu,
            roman_primary: w.roman,
            roman_accepted_variants: [w.roman],
            english_meaning: w.meaning,
            components: null,
          })),
          from_ai: true,
        });
      }
      // If duplicate, retry
      console.warn(
        `[sentence route] AI generated duplicate (attempt ${attempts}), retrying...`
      );
    } else {
      // AI failed, break to fallback
      break;
    }
  }

  // Fallback: use local sentence bank
  console.warn(
    "[sentence route] AI generation failed or exhausted, falling back to local bank"
  );

  const candidates = UrduSentenceBank.filter(
    (s) => !excluded.has(s.id) && !excluded.has(s.urdu.replace(/\s+/g, " ").trim())
  );
  const pool = candidates.length > 0 ? candidates : UrduSentenceBank;
  const sentence = pool[Math.floor(Math.random() * pool.length)];

  return Response.json({
    id: sentence.id,
    urdu: sentence.urdu,
    roman_primary: sentence.roman_primary,
    roman_accepted_variants: sentence.roman_accepted_variants,
    difficulty: sentence.difficulty,
    words: sentence.words.map((w) => ({
      urdu: w.urdu,
      roman_primary: w.roman_primary,
      roman_accepted_variants: w.roman_accepted_variants,
      english_meaning: w.english_meaning,
      components: w.components ?? null,
    })),
    from_ai: false,
  });
}
