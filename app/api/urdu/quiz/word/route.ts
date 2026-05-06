import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduWordCache, type UrduWordComponents, type UrduLetterComponent } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are an expert in Urdu language. Respond only in valid JSON with no markdown, no code fences.";

const USER_PROMPT =
  "Give me a random common Urdu word suitable for language learning.\n" +
  "Vary the theme each time — include words from these categories:\n" +
  "emotions, nature, relationships, everyday objects, food, time, " +
  "places, actions, poetry and literature, spirituality.\n" +
  "Return a JSON object with these exact keys:\n" +
  "- roman: the Roman transliteration\n" +
  "- urdu_script: the word in Urdu Nastaliq script\n" +
  "- meaning: English meaning\n" +
  "- components: array of objects each with:\n" +
  "    letter_urdu, letter_roman, position, form_note\n" +
  "- pronunciation_note: short pronunciation note\n" +
  "- calligraphy_note: short note on Nastaliq appearance";

type DeepSeekResult = {
  roman: string;
  urdu_script: string;
  meaning: string;
  components: UrduLetterComponent[];
  pronunciation_note: string;
  calligraphy_note: string;
};

function isValidResult(obj: unknown): obj is DeepSeekResult {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.roman === "string" &&
    typeof r.urdu_script === "string" &&
    typeof r.meaning === "string" &&
    Array.isArray(r.components) &&
    typeof r.pronunciation_note === "string" &&
    typeof r.calligraphy_note === "string"
  );
}

export async function GET() {
  console.log("[word-quiz] GET called");

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[word-quiz] DEEPSEEK_API_KEY defined:", !!process.env.DEEPSEEK_API_KEY);

  const deepseek = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY!,
    timeout: 10_000,
  });

  let parsed: DeepSeekResult;
  try {
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    console.log("[word-quiz] raw response:", raw);
    const obj: unknown = JSON.parse(raw);
    if (!isValidResult(obj)) {
      return Response.json(
        { error: "DeepSeek returned an unexpected shape" },
        { status: 500 }
      );
    }
    parsed = obj;
  } catch (err) {
    const message = err instanceof Error ? err.message : "DeepSeek call failed";
    console.error("[word-quiz] error:", message);
    return Response.json({ error: message }, { status: 500 });
  }

  // Grow the cache passively — skip insert if roman already present.
  const [existing] = await db
    .select()
    .from(urduWordCache)
    .where(sql`lower(${urduWordCache.roman}) = ${parsed.roman.toLowerCase()}`)
    .limit(1);

  if (!existing) {
    await db.insert(urduWordCache).values({
      roman: parsed.roman,
      urduScript: parsed.urdu_script,
      components: parsed.components as UrduWordComponents,
      meaning: parsed.meaning,
      pronunciationNote: parsed.pronunciation_note,
      calligraphyNote: parsed.calligraphy_note,
    });
  }

  const component_count = parsed.components.length;
  const question_type = component_count <= 3 ? "meaning" : "length";
  const correct_answer =
    question_type === "meaning"
      ? parsed.meaning.toLowerCase()
      : parsed.roman.toLowerCase();

  return Response.json({
    urdu_script: parsed.urdu_script,
    roman: parsed.roman,
    meaning: parsed.meaning,
    component_count,
    question_type,
    correct_answer,
  });
}
