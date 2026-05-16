/**
 * AI-powered sentence scoring using DeepSeek.
 *
 * Sends the Urdu sentence, expected Roman Urdu, word breakdown, and user answer
 * to DeepSeek for evaluation. Falls back to local rule-based scoring if AI fails.
 */

import { scoreSentence, type SentenceScoreResult } from "./sentence-scoring";

export type AiWordResult = {
  urdu: string;
  expected: string;
  user: string;
  status: "correct" | "accepted_variant" | "incorrect" | "missing" | "extra";
  feedback: string;
};

export type AiEvaluationResult = {
  score_percent: number;
  is_correct: boolean;
  overall_feedback: string;
  expected_roman: string;
  user_roman_normalized: string;
  word_results: AiWordResult[];
};

export type AiSentenceScoreResult = SentenceScoreResult & {
  ai_evaluation: AiEvaluationResult | null;
  used_ai: boolean;
};

/**
 * Evaluate a user's Roman Urdu sentence answer using DeepSeek.
 *
 * @param userAnswer - The user's Roman Urdu input
 * @param urduSentence - The original Urdu sentence
 * @param expectedRoman - The expected Roman Urdu transliteration
 * @param words - Word breakdown from the question
 * @returns AI evaluation result, or null if AI call fails
 */
export async function evaluateWithDeepSeek(
  userAnswer: string,
  urduSentence: string,
  expectedRoman: string,
  words: { urdu: string; roman_primary: string; roman_accepted_variants: string[] }[],
  signal?: AbortSignal
): Promise<AiEvaluationResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("[evaluateWithDeepSeek] No DEEPSEEK_API_KEY configured");
    return null;
  }

  const wordBreakdown = words
    .map(
      (w) =>
        `- "${w.urdu}" → expected: "${w.roman_primary}" (accepted variants: ${w.roman_accepted_variants
          .map((v) => `"${v}"`)
          .join(", ")})`
    )
    .join("\n");

  const prompt = `You are an Urdu language tutor evaluating a student's Roman Urdu reading exercise.

This is NOT an English translation quiz. The student must read the Urdu sentence aloud in Roman Urdu.

## Task
Evaluate whether the student correctly read the Urdu sentence in Roman Urdu.

## Input

**Urdu sentence:** ${urduSentence}

**Expected Roman Urdu:** ${expectedRoman}

**Word breakdown:**
${wordBreakdown}

**Student's Roman Urdu answer:** ${userAnswer}

## Evaluation Rules

1. Be tolerant of Roman Urdu spelling variation. Accept phonetic variants:
   - aj/aaj, kon/kaun/koun, deen/din, hay/hai/hey, ye/yeh, mujhe/muzhe/muje
   - Single vs double vowels: a/aa, i/ee, u/oo, e/ee, o/oo
   - Common substitutions: z/j, s/sh, k/q, ph/f, t/th, d/dh
   - Hindi/Urdu Romanization variants are acceptable
   - Silent h at end of words: hai/hai, yeh/ye, nah/na
   - Word-final y/i variation: meri/mery, kitabi/kitaby

2. Penalize ONLY when the reading is clearly wrong:
   - Wrong word entirely (e.g., "book" instead of "water")
   - Missing critical words
   - Extra words that change meaning
   - English translation instead of Roman Urdu

3. Align words intelligently:
   - One Urdu word may map to multiple Roman tokens (e.g., "کون سا" → "kaun sa")
   - Multiple Urdu words may merge in Roman (e.g., "میں نے" → "maine")
   - Handle word boundary differences gracefully

4. Return ONLY valid JSON with this exact schema (no markdown, no extra text):

{
  "score_percent": number (0-100),
  "is_correct": boolean (true if score >= 80),
  "overall_feedback": "brief feedback string",
  "expected_roman": "the expected Roman Urdu",
  "user_roman_normalized": "normalized version of user's answer",
  "word_results": [
    {
      "urdu": "Urdu word",
      "expected": "expected Roman for this word",
      "user": "what user wrote for this word (or empty string if missing)",
      "status": "correct" | "accepted_variant" | "incorrect" | "missing" | "extra",
      "feedback": "brief feedback for this word"
    }
  ]
}

## Scoring Guidelines
- 100%: Perfect or acceptable phonetic variants throughout
- 80-99%: Mostly correct with minor issues
- 60-79%: Several errors but overall readable
- Below 60%: Significant reading errors
- is_correct should be true if score_percent >= 80`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal,
    });

    if (!response.ok) {
      console.warn(
        `[evaluateWithDeepSeek] DeepSeek API error: ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn("[evaluateWithDeepSeek] No content in response");
      return null;
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed: AiEvaluationResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        console.warn(
          "[evaluateWithDeepSeek] Could not parse AI response",
          content.slice(0, 300)
        );
        return null;
      }
    }

    // Validate required fields
    if (
      typeof parsed.score_percent !== "number" ||
      typeof parsed.is_correct !== "boolean" ||
      !Array.isArray(parsed.word_results)
    ) {
      console.warn("[evaluateWithDeepSeek] Invalid response structure");
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("[evaluateWithDeepSeek] Error:", error);
    return null;
  }
}

const AI_TIMEOUT_MS = 12_000;

/**
 * Score a user's sentence answer using AI as primary evaluator.
 * Falls back to local rule-based scoring if AI fails or times out.
 */
export async function scoreSentenceWithAI(
  userAnswer: string,
  urduSentence: string,
  expectedRoman: string,
  words: { urdu: string; roman_primary: string; roman_accepted_variants: string[] }[]
): Promise<AiSentenceScoreResult> {
  // Try AI evaluation first with a hard timeout
  let aiResult: AiEvaluationResult | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AI_TIMEOUT_MS);

    aiResult = await evaluateWithDeepSeek(
      userAnswer,
      urduSentence,
      expectedRoman,
      words,
      controller.signal
    );

    clearTimeout(timeoutId);
  } catch (err) {
    console.warn("[scoreSentenceWithAI] AI evaluation failed or timed out", err);
    aiResult = null;
  }

  if (aiResult) {
    // Convert AI result to match the existing SentenceScoreResult format
    const wordResults = aiResult.word_results.map((wr) => ({
      urdu: wr.urdu,
      expected: wr.expected,
      userAnswer: wr.user || null,
      isCorrect: wr.status === "correct" || wr.status === "accepted_variant",
      isPhoneticVariant: wr.status === "accepted_variant",
      matchedVariant: wr.status === "accepted_variant" ? wr.user : null,
    }));

    const totalWords = wordResults.length;
    const wordsCorrect = wordResults.filter((w) => w.isCorrect).length;

    return {
      score: aiResult.score_percent,
      wordsCorrect,
      totalWords,
      wordResults,
      normalizedExpected: aiResult.expected_roman,
      normalizedUser: aiResult.user_roman_normalized,
      feedback: aiResult.overall_feedback,
      ai_evaluation: aiResult,
      used_ai: true,
    };
  }

  // Fallback to local rule-based scoring
  const localResult = scoreSentence(userAnswer, words);
  return {
    ...localResult,
    ai_evaluation: null,
    used_ai: false,
  };
}
