import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";
import { checkRomanUrduAnswer } from "@/lib/urdu/normalize";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { user_answer, correct_answer, urdu_script, roman, meaning } =
    (body ?? {}) as {
      user_answer?: string;
      correct_answer?: string;
      urdu_script?: string;
      roman?: string;
      meaning?: string;
    };

  if (!user_answer || !correct_answer || !urdu_script || !roman) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Always validate against Roman Urdu transliteration, never English meaning
  const { isCorrect: is_correct, matchedVariant } = checkRomanUrduAnswer(
    user_answer,
    correct_answer,
    [] // No predefined variants for word quiz; the normalization handles variants
  );

  const feedback = is_correct
    ? matchedVariant && matchedVariant !== correct_answer
      ? `Accepted. Common Roman Urdu spelling: ${user_answer}. Standard form: ${correct_answer}.`
      : `Correct! "${urdu_script}" is written as "${roman}" in Roman Urdu.`
    : `Not quite. "${urdu_script}" is "${roman}" in Roman Urdu.`;

  await db.insert(urduQuizHistory).values({
    userId: session.user.email ?? session.user.id,
    quizType: "word",
    question: urdu_script,
    userAnswer: user_answer.trim(),
    correctAnswer: correct_answer,
    isCorrect: is_correct,
  });

  return Response.json({ is_correct, correct_answer, feedback, meaning, roman });
}
