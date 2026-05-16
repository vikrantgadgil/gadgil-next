import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduWordCache } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * AI-powered word lookup fallback.
 * Uses DeepSeek to provide detailed breakdown of Urdu words.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { word } = (body ?? {}) as { word?: string };

  if (!word || typeof word !== "string") {
    return Response.json({ error: "Missing word parameter" }, { status: 400 });
  }

  // Check cache first
  const [cached] = await db
    .select()
    .from(urduWordCache)
    .where(sql`lower(${urduWordCache.roman}) = ${word.toLowerCase()}`)
    .limit(1);

  if (cached) {
    return Response.json({
      roman: cached.roman,
      urdu_script: cached.urduScript,
      meaning: cached.meaning,
      components: cached.components,
      explanation: cached.pronunciationNote ?? "",
      from_cache: true,
    });
  }


  // Call DeepSeek API
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI lookup not configured" }, { status: 503 });
  }

  const prompt = `You are an Urdu script tutor. Given a Roman Urdu word, provide:
- urdu_script: the Urdu script
- roman_urdu_primary: the standard Roman Urdu spelling
- roman_urdu_accepted_variants: common variant spellings
- components: breakdown of each character (urdu, name, roman, role)
- explanation: brief explanation of the word
- english_meaning: English meaning (supplemental only)

Word: "${word}"

Return JSON only.`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    const result = {
      roman: word,
      urdu_script: parsed.urdu_script ?? "",
      meaning: parsed.english_meaning ?? "",
      components: parsed.components ?? [],
      explanation: parsed.explanation ?? "",
      roman_urdu_primary: parsed.roman_urdu_primary ?? word,
      roman_urdu_accepted_variants: parsed.roman_urdu_accepted_variants ?? [],
      from_cache: false,
    };

    // Cache the result (store explanation in pronunciationNote field)
    try {
      await db.insert(urduWordCache).values({
        roman: word,
        urduScript: result.urdu_script,
        meaning: result.meaning,
        components: result.components,
        pronunciationNote: result.explanation,
      });
    } catch {
      // Non-fatal cache failure
    }


    return Response.json(result);
  } catch (error) {
    console.error("Word lookup error:", error);
    return Response.json(
      { error: "Failed to look up word. Please try again." },
      { status: 500 }
    );
  }
}
