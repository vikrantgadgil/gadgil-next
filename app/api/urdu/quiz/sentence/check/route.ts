import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";
import { scoreSentence } from "@/lib/urdu/sentence-scoring";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { user_answer, sentence_id, words } = (body ?? {}) as {
    user_answer?: string;
    sentence_id?: string;
    words?: { urdu: string; roman_primary: string; roman_accepted_variants: string[] }[];
  };

  if (!user_answer || !words || !sentence_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = scoreSentence(user_answer, words);

  // Log to quiz history
  await db.insert(urduQuizHistory).values({
    userId: session.user.email ?? session.user.id,
    quizType: "sentence",
    question: sentence_id,
    userAnswer: user_answer.trim(),
    correctAnswer: result.normalizedExpected,
    isCorrect: result.score === 100,
  });

  return Response.json({
    score: result.score,
    wordsCorrect: result.wordsCorrect,
    totalWords: result.totalWords,
    wordResults: result.wordResults,
    normalizedExpected: result.normalizedExpected,
    normalizedUser: result.normalizedUser,
    feedback: result.feedback,
  });
}
