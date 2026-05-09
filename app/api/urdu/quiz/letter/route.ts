import { auth } from "@/auth";
import { UrduLetters, type UrduLetter } from "@/lib/urdu/letters";

type Position = "standalone" | "initial" | "medial" | "final";
const POSITIONS: Position[] = ["standalone", "initial", "medial", "final"];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const excludeParam = searchParams.get("exclude") ?? "";
  const excluded = new Set(excludeParam.split(",").filter(Boolean));

  const candidates: { letter: UrduLetter; position: Position }[] = [];
  for (const letter of UrduLetters) {
    for (const position of POSITIONS) {
      if (!excluded.has(`${letter.name}-${position}`)) {
        candidates.push({ letter, position });
      }
    }
  }

  // Fallback: ignore exclusions if all candidates were filtered out
  const pool =
    candidates.length > 0
      ? candidates
      : UrduLetters.flatMap((letter) =>
          POSITIONS.map((position) => ({ letter, position }))
        );

  const { letter, position } = pool[Math.floor(Math.random() * pool.length)];
  const form = letter[position];

  return Response.json({
    question_glyph: form.glyph,
    position,
    letter_name: letter.name,
    roman_answer: letter.name,
    alternates: letter.alternates,
    hint: form.hint,
  });
}
