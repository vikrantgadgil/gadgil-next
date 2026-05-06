import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";

const ALTERNATES: Record<string, string[]> = {
  alef:  ["alif", "a"],
  be:    ["ba", "b"],
  pe:    ["p"],
  te:    ["ta", "t"],
  nun:   ["noon", "n"],
  meem:  ["mim", "m"],
  lam:   ["l"],
  kaf:   ["k"],
  re:    ["ra", "r"],
  wao:   ["waw", "vao", "w"],
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
  const { roman_answer, correct_answer, question } = (body ?? {}) as {
    roman_answer?: string;
    correct_answer?: string;
    question?: string;
  };

  if (!roman_answer || !correct_answer || !question) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Derive letter_name and position from the values already in the payload.
  const letter_name = correct_answer;
  const position = question.split(":")[0].trim();

  const is_correct = isAccepted(roman_answer, correct_answer);

  const feedback = is_correct
    ? `Correct! That is ${letter_name} in ${position} form.`
    : `Not quite. That is ${letter_name} in ${position} form.`;

  await db.insert(urduQuizHistory).values({
    userId: session.user.email ?? session.user.id,
    quizType: "letter",
    question,
    userAnswer: roman_answer.trim(),
    correctAnswer: correct_answer,
    isCorrect: is_correct,
  });

  return Response.json({ is_correct, correct_answer, feedback, letter_name });
}
