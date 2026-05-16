  /**
 * normalizeRomanUrdu(input: string)
 * 
 * Normalizes Roman Urdu text for fuzzy matching in quizzes.
 * Handles common Romanization variants, diacritics, and phonetic equivalences.
 */

export type Strictness = "strict" | "relaxed";

/**
 * Basic normalization: lowercase, trim, remove punctuation, collapse spaces.
 */
function basicNormalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    // Remove apostrophes and special chars used for ayn/hamza first
    .replace(/['ʿʾ`ˈ]/g, "")
    // Replace other punctuation with space
    .replace(/[.,!?;:"()\[\]{}«»\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize diacritics: ā → aa, ī → ee, ū → oo
 */
function normalizeDiacritics(s: string): string {
  return s
    .replace(/ā/g, "aa")
    .replace(/ī/g, "ee")
    .replace(/ū/g, "oo");
}

/**
 * Strict normalization: basic + diacritics only.
 * Used for exact matching after normalization.
 */
export function normalizeRomanUrduStrict(input: string): string {
  return normalizeDiacritics(basicNormalize(input));
}

/**
 * Relaxed normalization: includes phonetic equivalences.
 * - dh → d, th → t, bh → b, ph → p, gh → g
 * - ain/ein equivalence (both → ain)
 * - x/kh equivalence (both → kh)
 * - q/k optional equivalence (both → k)
 * - ee → i, oo → u
 * - Remove apostrophes used for ayn/hamza
 * - Collapse repeated characters
 */
export function normalizeRomanUrduRelaxed(input: string): string {
  let s = basicNormalize(input);

  // Remove apostrophes (ayn/hamza markers)
  s = s.replace(/['ʿʾ`ˈ]/g, "");

  // Normalize diacritics
  s = normalizeDiacritics(s);

  // ain/ein → ain (must be before e→i normalization)
  s = s.replace(/\bein\b/g, "ain");

  // Vowel length normalization
  s = s.replace(/ee/g, "i");
  s = s.replace(/oo/g, "u");
  // ay/ey → i at word endings (common in Roman Urdu like mujhay/mujhey)
  s = s.replace(/ay$/g, "i");
  s = s.replace(/ey$/g, "i");

  // e/i equivalence (common in Roman Urdu letter names and words)
  s = s.replace(/e/g, "i");

  // y at end of word after consonant acts as vowel (e.g., bey → bi, bay → ba)
  // But NOT after vowel (e.g., "ye" → "yi", not "")
  s = s.replace(/([bcdfghjklmnpqrstvwxz])y$/g, "$1");

  // h at end of word after e/i is often silent (e.g., yeh → ye, nah → na)
  // But NOT after other vowels (e.g., "ruh" → keep the h)
  s = s.replace(/([ei])h$/g, "$1");


  // ah → a at word end (e.g., maddah → madda)
  s = s.replace(/ah\b/g, "a");


  // x → kh
  s = s.replace(/x/g, "kh");

  // Aspirated consonant simplification
  s = s.replace(/dh/g, "d");
  s = s.replace(/th/g, "t");
  s = s.replace(/bh/g, "b");
  s = s.replace(/ph/g, "p");
  s = s.replace(/gh/g, "g");
  s = s.replace(/jh/g, "j");

  // j/z/zh tolerance for common Roman Urdu words (e.g., mujhe/muzhe)
  // zh → j (common in Roman Urdu for the same sound as j)
  s = s.replace(/zh/g, "j");



  // q → k (optional, common in relaxed Roman Urdu)
  s = s.replace(/q/g, "k");

  // Collapse repeated vowel characters only (e.g., "aa" → "a", "ii" → "i")
  // Do NOT collapse consonant doubles (e.g., "dd" in "madda", "bb" in "mohabbat")
  s = s.replace(/([aeiou])\1+/g, "$1");

  return s.trim();
}

/**
 * Main normalization function.
 * @param input - The user's answer or expected answer
 * @param strictness - "strict" or "relaxed"
 */
export function normalizeRomanUrdu(
  input: string,
  strictness: Strictness = "relaxed"
): string {
  if (strictness === "strict") {
    return normalizeRomanUrduStrict(input);
  }
  return normalizeRomanUrduRelaxed(input);
}

/**
 * Check if a user's answer matches any of the accepted answers.
 * 
 * @param userAnswer - The user's input
 * @param primaryAnswer - The primary correct answer
 * @param acceptedVariants - Array of accepted variant spellings
 * @param strictness - "strict" or "relaxed"
 * @returns Object with isCorrect and feedback info
 */
export function checkRomanUrduAnswer(
  userAnswer: string,
  primaryAnswer: string,
  acceptedVariants: string[] = [],
  strictness: Strictness = "relaxed"
): { isCorrect: boolean; matchedVariant: string | null } {
  const normUser = normalizeRomanUrdu(userAnswer, strictness);
  const normPrimary = normalizeRomanUrdu(primaryAnswer, strictness);

  // Check against primary
  if (normUser === normPrimary) {
    return { isCorrect: true, matchedVariant: primaryAnswer };
  }

  // Check against accepted variants
  for (const variant of acceptedVariants) {
    const normVariant = normalizeRomanUrdu(variant, strictness);
    if (normUser === normVariant) {
      return { isCorrect: true, matchedVariant: variant };
    }
  }

  // If strict mode failed, try relaxed mode
  if (strictness === "strict") {
    return checkRomanUrduAnswer(userAnswer, primaryAnswer, acceptedVariants, "relaxed");
  }

  return { isCorrect: false, matchedVariant: null };
}
