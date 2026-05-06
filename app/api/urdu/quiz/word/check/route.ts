import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";

function normalizeRoman(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-\s]/g, "")
    .replace(/ph/g, "f")
    .replace(/kh/g, "x")
    .replace(/gh/g, "g")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/w/g, "v")
    .replace(/(.)\1/g, "$1");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { user_answer, correct_answer, question_type, urdu_script, roman, meaning } =
    (body ?? {}) as {
      user_answer?: string;
      correct_answer?: string;
      question_type?: string;
      urdu_script?: string;
      roman?: string;
      meaning?: string;
    };

  if (!user_answer || !correct_answer || !question_type || !urdu_script || !roman) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const norm = user_answer.toLowerCase().trim();
  const normCorrect = correct_answer.toLowerCase().trim();

  let is_correct: boolean;
  if (question_type === "meaning") {
    is_correct =
      norm.includes(normCorrect) || normCorrect.includes(norm);
  } else {
    is_correct =
      norm === normCorrect ||
      normalizeRoman(user_answer) === normalizeRoman(correct_answer);
  }

  const feedback = is_correct
    ? question_type === "meaning"
      ? `Correct! "${roman}" means "${meaning ?? correct_answer}".`
      : `Correct! "${urdu_script}" is spelled "${roman}" (${correct_answer.length} letters).`
    : question_type === "meaning"
    ? `Not quite. "${roman}" means "${meaning ?? correct_answer}".`
    : `Not quite. "${urdu_script}" is spelled "${roman}" — that's ${correct_answer.length} letters.`;

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
