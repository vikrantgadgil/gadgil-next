/**
 * Bond Ladder Engine
 *
 * Builds a zero-coupon bond ladder from a target monthly payout and a yield curve.
 * Uses linear interpolation between known yield-curve points to get a rate for any
 * year, then computes the present value (cost) of each rung.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type YieldCurve = Record<string, number>; // e.g. { "1Y": 4.25, "2Y": 4.10, … }

export type BondType =
  | "T-Bill / SGOV"
  | "1-3Y iBonds IBTE"
  | "3-7Y IBTI"
  | "7-10Y IBTM"
  | "10-20Y IBTL"
  | "Long T-Bond TLT";

export type LadderRung = {
  year: number;
  maturityDate: string; // ISO date string, e.g. "2027-05-13"
  annualPayout: number;
  monthlyPayout: number;
  discountRate: number; // as a percentage, e.g. 4.25
  presentValue: number;
  percentageOfCorpus: number; // e.g. 5.23 (meaning 5.23%)
  bondType: BondType;
};

export type LadderResult = {
  totalCorpusRequired: number;
  totalLifetimePayouts: number;
  rungs: LadderRung[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a yield-curve key like "1Y" or "10Y" into a number of years. */
function parseYearKey(key: string): number {
  return parseInt(key.replace("Y", ""), 10);
}

/**
 * Linear interpolation: given a sorted array of known points (x, y),
 * return the y value at targetX. Clamps to the nearest known point if
 * targetX is outside the range.
 */
function interpolate(
  known: { x: number; y: number }[],
  targetX: number,
): number {
  if (known.length === 0) return 0;
  if (targetX <= known[0].x) return known[0].y;
  if (targetX >= known[known.length - 1].x) return known[known.length - 1].y;

  for (let i = 0; i < known.length - 1; i++) {
    const a = known[i];
    const b = known[i + 1];
    if (targetX >= a.x && targetX <= b.x) {
      const t = (targetX - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }

  return known[known.length - 1].y;
}

/** Determine the bond type label based on maturity year. */
function getBondType(year: number): BondType {
  if (year <= 1) return "T-Bill / SGOV";
  if (year <= 3) return "1-3Y iBonds IBTE";
  if (year <= 5) return "3-7Y IBTI";
  if (year <= 7) return "7-10Y IBTM";
  if (year <= 10) return "10-20Y IBTL";
  return "Long T-Bond TLT";
}

/** Format a date as YYYY-MM-DD given a year offset from now. */
function maturityDate(year: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + year);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Build a zero-coupon bond ladder.
 *
 * @param targetMonthlyPayout - Desired monthly income (e.g. 5000)
 * @param durationYears       - Number of years the ladder should run
 * @param yieldCurve          - Object mapping "1Y".."30Y" to percentage rates
 */
export function buildBondLadder(
  targetMonthlyPayout: number,
  durationYears: number,
  yieldCurve: YieldCurve,
): LadderResult {
  // Sort known yield-curve points by year
  const knownPoints = Object.entries(yieldCurve)
    .map(([key, rate]) => ({ x: parseYearKey(key), y: rate }))
    .sort((a, b) => a.x - b.x);

  const annualPayout = targetMonthlyPayout * 12;
  const rungs: LadderRung[] = [];

  for (let year = 1; year <= durationYears; year++) {
    const rate = interpolate(knownPoints, year);
    const rateDecimal = rate / 100;
    // PV = FV / (1 + r)^t  (zero-coupon bond pricing)
    const presentValue = annualPayout / Math.pow(1 + rateDecimal, year);

    rungs.push({
      year,
      maturityDate: maturityDate(year),
      annualPayout,
      monthlyPayout: targetMonthlyPayout,
      discountRate: Math.round(rate * 100) / 100,
      presentValue: Math.round(presentValue * 100) / 100,
      percentageOfCorpus: 0, // will compute after total is known
      bondType: getBondType(year),
    });
  }

  const totalCorpusRequired = Math.round(
    rungs.reduce((sum, r) => sum + r.presentValue, 0) * 100,
  ) / 100;

  const totalLifetimePayouts = annualPayout * durationYears;

  // Compute percentage of corpus for each rung
  for (const rung of rungs) {
    rung.percentageOfCorpus =
      totalCorpusRequired > 0
        ? Math.round((rung.presentValue / totalCorpusRequired) * 10000) / 100
        : 0;
  }

  return {
    totalCorpusRequired,
    totalLifetimePayouts,
    rungs,
  };
}
