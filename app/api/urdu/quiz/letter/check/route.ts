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
  const { roman_answer, correct_answer, question, alternates } = (body ?? {}) as {
    roman_answer?: string;
    correct_answer?: string;
    question?: string;
    alternates?: string[];
  };

  if (!roman_answer || !correct_answer || !question) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Derive letter_name and position from the values already in the payload.
  const letter_name = correct_answer;
  const position = question.split(":")[0].trim();

  const { isCorrect: is_correct, matchedVariant } = checkRomanUrduAnswer(
    roman_answer,
    correct_answer,
    alternates ?? []
  );

  const feedback = is_correct
    ? matchedVariant && matchedVariant !== correct_answer
      ? `Accepted. Common Roman Urdu spelling: ${roman_answer}. Standard form: ${correct_answer}.`
      : `Correct! That is ${letter_name} in ${position} form.`
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
