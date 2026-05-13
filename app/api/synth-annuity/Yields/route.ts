import { NextResponse } from "next/server";

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

export async function GET() {
  return NextResponse.json({
    yields: TREASURY_YIELDS,
    fetchedAt: new Date().toISOString(),
    source: "Static fallback (US Treasury curve, May 2026)",
  });
}