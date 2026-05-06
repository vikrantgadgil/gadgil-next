import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  urduWordCache,
  type UrduLetterComponent,
  type UrduWordComponents,
} from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are an expert in Urdu language, script, and calligraphy. " +
  "Respond only in valid JSON with no markdown, no code fences.";

function userPrompt(roman: string) {
  return (
    `For the Roman Urdu word: ${roman}\n` +
    "Return a JSON object with these exact keys:\n" +
    "- urdu_script: the word written in Urdu Nastaliq script\n" +
    "- meaning: English meaning of the word\n" +
    "- components: an array of objects, each with:\n" +
    "    letter_urdu: the Urdu letter\n" +
    "    letter_roman: its Roman equivalent\n" +
    "    position: one of initial | medial | final | standalone\n" +
    "    form_note: brief note on how this letter looks in this position\n" +
    "- pronunciation_note: a short note on how to pronounce the word\n" +
    "- calligraphy_note: a note on how this word looks written in Nastaliq"
  );
}

type DeepSeekResult = {
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
    typeof r.urdu_script === "string" &&
    typeof r.meaning === "string" &&
    Array.isArray(r.components) &&
    typeof r.pronunciation_note === "string" &&
    typeof r.calligraphy_note === "string"
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const roman = typeof body?.roman === "string" ? body.roman.trim() : "";
  if (!roman) {
    return Response.json({ error: "roman is required" }, { status: 400 });
  }

  // Check cache (case-insensitive)
  const [cached] = await db
    .select()
    .from(urduWordCache)
    .where(sql`lower(${urduWordCache.roman}) = ${roman.toLowerCase()}`)
    .limit(1);

  if (cached) {
    return Response.json({
      roman: cached.roman,
      urdu_script: cached.urduScript,
      meaning: cached.meaning,
      components: cached.components as UrduWordComponents,
      pronunciation_note: cached.pronunciationNote ?? "",
      calligraphy_note: cached.calligraphyNote ?? "",
      fromCache: true,
    });
  }

  // Call DeepSeek
  const deepseek = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY!,
  });

  let parsed: DeepSeekResult;
  try {
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(roman) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const obj: unknown = JSON.parse(raw);
    if (!isValidResult(obj)) {
      return Response.json(
        { error: "DeepSeek returned an unexpected shape" },
        { status: 502 }
      );
    }
    parsed = obj;
  } catch (err) {
    const message = err instanceof Error ? err.message : "DeepSeek call failed";
    return Response.json({ error: message }, { status: 502 });
  }

  await db.insert(urduWordCache).values({
    roman,
    urduScript: parsed.urdu_script,
    components: parsed.components as UrduWordComponents,
    meaning: parsed.meaning,
    pronunciationNote: parsed.pronunciation_note,
    calligraphyNote: parsed.calligraphy_note,
  });

  return Response.json({
    roman,
    ...parsed,
    fromCache: false,
  });
}
