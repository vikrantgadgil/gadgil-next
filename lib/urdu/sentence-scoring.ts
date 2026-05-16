import { checkRomanUrduAnswer } from "./normalize";

export type WordResult = {
  urdu: string;
  expected: string;
  userAnswer: string | null;
  isCorrect: boolean;
  isPhoneticVariant: boolean;
  matchedVariant: string | null;
};

export type SentenceScoreResult = {
  score: number;
  wordsCorrect: number;
  totalWords: number;
  wordResults: WordResult[];
  normalizedExpected: string;
  normalizedUser: string;
  feedback: string;
};

/**
 * Score a user's sentence answer against the expected sentence.
 * Compares word by word using the existing Roman Urdu validator.
 */
export function scoreSentence(
  userAnswer: string,
  expectedWords: { urdu: string; roman_primary: string; roman_accepted_variants: string[] }[]
): SentenceScoreResult {
  const userWords = userAnswer
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = expectedWords.length;
  let correctCount = 0;
  const wordResults: WordResult[] = [];

  for (let i = 0; i < totalWords; i++) {
    const expected = expectedWords[i];
    const userWord = i < userWords.length ? userWords[i] : null;

    if (!userWord) {
      // Missing word
      wordResults.push({
        urdu: expected.urdu,
        expected: expected.roman_primary,
        userAnswer: null,
        isCorrect: false,
        isPhoneticVariant: false,
        matchedVariant: null,
      });
      continue;
    }

    const result = checkRomanUrduAnswer(
      userWord,
      expected.roman_primary,
      expected.roman_accepted_variants,
      "relaxed"
    );

    const isPhoneticVariant =
      result.isCorrect &&
      result.matchedVariant !== null &&
      result.matchedVariant !== expected.roman_primary;

    if (result.isCorrect) {
      correctCount++;
    }

    wordResults.push({
      urdu: expected.urdu,
      expected: expected.roman_primary,
      userAnswer: userWord,
      isCorrect: result.isCorrect,
      isPhoneticVariant,
      matchedVariant: result.matchedVariant,
    });
  }

  // Penalty for extra words
  const extraWords = Math.max(0, userWords.length - totalWords);
  const penalty = extraWords * 0.5; // half point penalty per extra word
  const rawScore = (correctCount / totalWords) * 100;
  const score = Math.max(0, Math.round(rawScore - penalty * (100 / totalWords)));

  // Generate feedback
  let feedback: string;
  if (score === 100) {
    feedback = "Perfect! All words correct.";
  } else if (score >= 80) {
    feedback = "Good. Some spellings were accepted as Roman Urdu variants.";
  } else if (score >= 60) {
    feedback = "Fair. Try to match the Roman Urdu more closely.";
  } else {
    feedback = "Keep practicing. Focus on reading each word carefully.";
  }

  const normalizedExpected = expectedWords.map((w) => w.roman_primary).join(" ");
  const normalizedUser = userWords.join(" ");

  return {
    score,
    wordsCorrect: correctCount,
    totalWords,
    wordResults,
    normalizedExpected,
    normalizedUser,
    feedback,
  };
}
