import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";

// All accepted romanizations for each canonical letter name.
const ALTERNATES: Record<string, string[]> = {
  alef:  ["alif", "a"],
  be:    ["ba", "b"],
  pe:    ["p"],
  te:    ["ta", "t"],
  nun:   ["noon", "n"],
  meem:  ["mim", "m"],
  lam:   ["l"],
  kaf:   ["k", "ke"],
  re:    ["ra", "r"],
  wao:   ["waw", "w", "vao"],
};

function isAccepted(input: string, canonical: string): boolean {
  const norm = input.toLowerCase().trim();
  if (norm === canonical) return true;
  return (ALTERNATES[canonical] ?? []).includes(norm);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const {
    roman_answer,
    correct_answer,
    question,
    letter_name,
    position,
  } = (body ?? {}) as {
    roman_answer?: string;
    correct_answer?: string;
    question?: string;
    letter_name?: string;
    position?: string;
  };

  if (!roman_answer || !correct_answer || !question || !letter_name || !position) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const is_correct = isAccepted(roman_answer, correct_answer);

  const feedback = is_correct
    ? `Correct! That is ${letter_name} in ${position} form.`
    : `Not quite. That is ${letter_name} (${correct_answer}) in ${position} form.`;

  await db.insert(urduQuizHistory).values({
    userId: session.user.id,
    quizType: "letter",
    question,
    userAnswer: roman_answer.trim(),
    correctAnswer: correct_answer,
    isCorrect: is_correct,
  });

  return Response.json({ is_correct, correct_answer, feedback });
}
