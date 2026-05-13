import { NextRequest, NextResponse } from "next/server";
import { buildBondLadder } from "@/app/projects/synth-annuity/lib/engine";

const TREASURY_YIELDS = {
  "1Y": 4.25,
  "2Y": 4.10,
  "3Y": 4.00,
  "5Y": 3.95,
  "7Y": 4.00,
  "10Y": 4.15,
  "20Y": 4.30,
  "30Y": 4.40,
};

const STATIC_GUIDE =
  "This portfolio uses a bond ladder built with US Treasury securities. " +
  "Each rung represents a zero-coupon bond that matures in a specific year, " +
  "providing a known payout at maturity. By holding bonds to maturity, you " +
  "eliminate interest rate risk and guarantee your income stream.";

/**
 * Generate a 3-sentence implementation guide using DeepSeek.
 * Falls back to a static guide if the API call fails.
 */
async function generateGuide(
  monthlyPayout: number,
  durationYears: number,
  rungs: { year: number; bondType: string }[],
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return STATIC_GUIDE;

  // Build a compact summary of the rungs
  const rungSummary = rungs
    .map((r) => `Year ${r.year}: ${r.bondType}`)
    .join(", ");

  const prompt = `You are an investment committee explaining a bond ladder to a retiree. The client needs $${monthlyPayout}/month for ${durationYears} years. We built a ladder with these rungs: ${rungSummary}. Write exactly three sentences: (1) What the portfolio does, (2) How it protects principal, (3) How to buy the required ETFs or bonds. Use plain language.`;

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("DeepSeek API error:", res.status, await res.text());
      return STATIC_GUIDE;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text?.trim() || STATIC_GUIDE;
  } catch (err) {
    console.error("DeepSeek API call failed:", err);
    return STATIC_GUIDE;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetMonthlyPayout, durationYears } = body;

    if (
      typeof targetMonthlyPayout !== "number" ||
      targetMonthlyPayout <= 0 ||
      typeof durationYears !== "number" ||
      durationYears <= 0 ||
      !Number.isInteger(durationYears)
    ) {
      return NextResponse.json(
        {
          error:
            "targetMonthlyPayout (positive number) and durationYears (positive integer) are required",
        },
        { status: 400 },
      );
    }

    const result = buildBondLadder(
      targetMonthlyPayout,
      durationYears,
      TREASURY_YIELDS,
    );

    // Generate the implementation guide (may fall back to static)
    const implementationGuide = await generateGuide(
      targetMonthlyPayout,
      durationYears,
      result.rungs.map((r) => ({ year: r.year, bondType: r.bondType })),
    );

    return NextResponse.json({
      ...result,
      implementationGuide,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
