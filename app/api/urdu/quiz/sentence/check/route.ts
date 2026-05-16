import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduQuizHistory } from "@/lib/db/schema";
import { scoreSentenceWithAI } from "@/lib/urdu/ai-sentence-scoring";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { user_answer, sentence_id, words, urdu_sentence, expected_roman } = (body ?? {}) as {
    user_answer?: string;
    sentence_id?: string;
    words?: { urdu: string; roman_primary: string; roman_accepted_variants: string[] }[];
    urdu_sentence?: string;
    expected_roman?: string;
  };

  if (!user_answer || !words || !sentence_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use AI as primary evaluator, fallback to local
  const result = await scoreSentenceWithAI(
    user_answer,
    urdu_sentence ?? "",
    expected_roman ?? words.map((w) => w.roman_primary).join(" "),
    words
  );

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
    used_ai: result.used_ai,
    ai_evaluation: result.ai_evaluation,
  });
}
