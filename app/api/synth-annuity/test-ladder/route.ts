import { NextResponse } from "next/server";
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

/**
 * GET /api/synth-annuity/test-ladder
 *
 * Hardcoded test: $5,000/month for 20 years.
 * Returns the ladder directly from the engine (no fetch).
 */
export async function GET() {
  const result = buildBondLadder(5000, 20, TREASURY_YIELDS);
  return NextResponse.json(result);
}
