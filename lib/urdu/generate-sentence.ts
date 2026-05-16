export type GeneratedSentence = {
  urdu: string;
  roman_primary: string;
  roman_accepted_variants: string[];
  english_meaning: string;
  difficulty: "beginner" | "easy" | "medium";
  words: {
    urdu: string;
    roman: string;
    meaning: string;
  }[];
};

const TOPICS = [
  "greetings",
  "weather",
  "family",
  "travel",
  "school",
  "food",
  "emotions",
  "daily activities",
  "shopping",
  "time/day",
  "polite conversation",
] as const;

export type Topic = (typeof TOPICS)[number] | "random";

export function getRandomTopic(): Topic {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

/**
 * Generate a sentence quiz question using DeepSeek.
 * Falls back to null if the API call fails.
 */
export async function generateUrduSentenceQuiz(
  difficulty: "beginner" | "easy" | "medium",
  topic: Topic = "random",
  recentSentences: string[] = []
): Promise<GeneratedSentence | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("[generateUrduSentenceQuiz] No DEEPSEEK_API_KEY configured");
    return null;
  }

  const selectedTopic = topic === "random" ? getRandomTopic() : topic;

  const recentBlock =
    recentSentences.length > 0
      ? `\nDo NOT generate any of these recently used sentences (avoid the same Urdu text or same Roman transliteration):\n${recentSentences
          .map((s) => `- ${s}`)
          .join("\n")}`
      : "";

  const wordCountHint =
    difficulty === "beginner"
      ? "3–5 words"
      : difficulty === "easy"
      ? "5–8 words"
      : "natural conversational length (6–10 words)";

  const prompt = `You are an Urdu language tutor generating quiz material for learners.

Generate a single natural Urdu sentence for a quiz. Follow these rules:

DIFFICULTY: ${difficulty} (${wordCountHint})
TOPIC: ${selectedTopic}

SENTENCE REQUIREMENTS:
- Natural, realistic Urdu that a learner might encounter
- Short to medium length (${wordCountHint})
- Use common, learner-appropriate vocabulary
- Avoid obscure or highly literary words
- Proper Urdu grammar
- Vary the sentence structure — do not repeat patterns from recent sentences

OUTPUT FORMAT:
Return ONLY valid JSON with this exact schema (no markdown, no extra text):

{
  "urdu": "the Urdu sentence in Nastaliq script",
  "roman_primary": "standard Roman Urdu transliteration",
  "roman_accepted_variants": ["variant1", "variant2"],
  "english_meaning": "English translation of the full sentence",
  "difficulty": "${difficulty}",
  "words": [
    {
      "urdu": "word in Urdu script",
      "roman": "Roman Urdu for this word",
      "meaning": "English meaning of this word"
    }
  ]
}

RULES:
- roman_primary should use standard Roman Urdu conventions
- roman_accepted_variants should include 1–3 common alternative spellings
- The words array must break down every word in the sentence
- Do NOT include punctuation like .!? in the Urdu sentence
- Keep the sentence natural${recentBlock}`;

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
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[generateUrduSentenceQuiz] DeepSeek API error: ${response.status}`
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn("[generateUrduSentenceQuiz] No content in response");
      return null;
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed: GeneratedSentence;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        console.warn(
          "[generateUrduSentenceQuiz] Could not parse AI response",
          content.slice(0, 200)
        );
        return null;
      }
    }

    // Validate the parsed result has required fields
    if (!parsed.urdu || !parsed.roman_primary || !Array.isArray(parsed.words)) {
      console.warn("[generateUrduSentenceQuiz] Invalid response structure");
      return null;
    }

    // Validate word count matches difficulty
    const wordCount = parsed.words.length;
    if (difficulty === "beginner" && (wordCount < 2 || wordCount > 6)) {
      console.warn(
        `[generateUrduSentenceQuiz] Beginner sentence has ${wordCount} words, regenerating...`
      );
      return null;
    }
    if (difficulty === "easy" && (wordCount < 4 || wordCount > 9)) {
      console.warn(
        `[generateUrduSentenceQuiz] Easy sentence has ${wordCount} words, regenerating...`
      );
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("[generateUrduSentenceQuiz] Error:", error);
    return null;
  }
}
