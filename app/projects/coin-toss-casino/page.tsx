"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp, AlertTriangle, BarChart2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Simulation core
// ---------------------------------------------------------------------------

const BASE_BET = 100;
const DAYS = 365;

type Toss = { bet: number; result: "WIN" | "LOSE" };
type DayResult = {
  day: number;
  tosses: Toss[];
  peakExposure: number;
  ruined: boolean;
};

function simulateDay(
  bankrollLimit: number,
  winProb: number
): { peakExposure: number; ruined: boolean } {
  let bet = BASE_BET;
  let wagered = 0;
  while (true) {
    if (bet > bankrollLimit) return { peakExposure: wagered, ruined: true };
    wagered += bet;
    if (Math.random() < winProb) return { peakExposure: wagered, ruined: false };
    bet *= 2;
  }
}

function generateYear(bankrollLimit: number, winProb: number): DayResult[] {
  const days: DayResult[] = [];
  for (let d = 0; d < DAYS; d++) {
    const tosses: Toss[] = [];
    let bet = BASE_BET;
    let wagered = 0;
    let ruined = false;
    while (true) {
      if (bet > bankrollLimit) { ruined = true; break; }
      const won = Math.random() < winProb;
      tosses.push({ bet, result: won ? "WIN" : "LOSE" });
      wagered += bet;
      if (won) break;
      bet *= 2;
    }
    days.push({ day: d + 1, tosses, peakExposure: wagered, ruined });
  }
  return days;
}

function simulateYear(
  bankrollLimit: number,
  winProb: number
): { dailyPeaks: number[]; maxExposure: number; hadRuin: boolean } {
  const dailyPeaks: number[] = [];
  let maxExposure = 0;
  let hadRuin = false;
  for (let d = 0; d < DAYS; d++) {
    const { peakExposure, ruined } = simulateDay(bankrollLimit, winProb);
    dailyPeaks.push(peakExposure);
    if (peakExposure > maxExposure) maxExposure = peakExposure;
    if (ruined) hadRuin = true;
  }
  return { dailyPeaks, maxExposure, hadRuin };
}

function martingaleLevels(bankrollLimit: number): number[] {
  const levels: number[] = [];
  let bet = BASE_BET;
  let total = 0;
  while (total + bet <= bankrollLimit) {
    total += bet;
    levels.push(total);
    bet *= 2;
  }
  return levels;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v}`;
}

function fmtFull(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

const RAMP = [
  "#22c55e", "#84cc16", "#eab308", "#f97316",
  "#ef4444", "#dc2626", "#b91c1c", "#7f1d1d", "#450a0a",
];

function barColor(index: number, total: number): string {
  const i = Math.round((index / Math.max(total - 1, 1)) * (RAMP.length - 1));
  return RAMP[Math.min(i, RAMP.length - 1)];
}

function exposureBarClass(ratio: number): string {
  if (ratio < 0.25) return "bg-emerald-500";
  if (ratio < 0.5) return "bg-yellow-400";
  if (ratio < 0.75) return "bg-orange-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// Watch It Happen — animated simulator
// ---------------------------------------------------------------------------

type AnimPhase = "idle" | "running" | "paused" | "ruin" | "done";
interface Anim {
  phase: AnimPhase;
  dayIdx: number;
  visibleTossCount: number;
  cumulativeExposure: number;
  completedDays: number;
  worstDayBet: number; // highest single bet placed on any day so far
}

const IDLE: Anim = { phase: "idle", dayIdx: 0, visibleTossCount: 0, cumulativeExposure: 0, completedDays: 0, worstDayBet: 0 };

const SPEED_OPTIONS = [
  { label: "0.5×", value: 0.5 },
  { label: "1×",   value: 1   },
  { label: "5×",   value: 5   },
  { label: "10×",  value: 10  },
] as const;

function WatchItHappen({
  bankrollLimit,
  winProb,
}: {
  bankrollLimit: number;
  winProb: number;
}) {
  const [speed, setSpeed] = useState<number>(1);
  const [anim, setAnim] = useState<Anim>(IDLE);
  const yearRef = useRef<DayResult[]>([]);

  // ms per individual toss reveal
  const tossDuration = speed >= 10 ? 28 : speed >= 5 ? 75 : speed >= 1 ? 310 : 620;
  // ms pause after the last toss of a day before moving on
  const dayPause = speed >= 10 ? 45 : speed >= 5 ? 110 : speed >= 1 ? 370 : 740;

  function start() {
    yearRef.current = generateYear(bankrollLimit, winProb);
    setAnim({ phase: "running", dayIdx: 0, visibleTossCount: 0, cumulativeExposure: 0, completedDays: 0, worstDayBet: 0 });
  }

  function togglePause() {
    setAnim((p) => ({ ...p, phase: p.phase === "running" ? "paused" : "running" }));
  }

  function reset() {
    yearRef.current = [];
    setAnim(IDLE);
  }

  // Core animation loop — re-schedules itself on every anim change while running
  useEffect(() => {
    if (anim.phase !== "running") return;
    const year = yearRef.current;
    if (!year.length) return;
    const day = year[anim.dayIdx];
    if (!day) return;

    const allShown = anim.visibleTossCount >= day.tosses.length;
    const delay = allShown ? dayPause : tossDuration;

    const timer = setTimeout(() => {
      setAnim((prev) => {
        if (prev.phase !== "running") return prev;

        // Still revealing tosses for this day
        if (prev.visibleTossCount < day.tosses.length) {
          return { ...prev, visibleTossCount: prev.visibleTossCount + 1 };
        }

        // All tosses shown — advance
        const newCum = prev.cumulativeExposure + day.peakExposure;
        const lastPlacedBet = day.tosses[day.tosses.length - 1]?.bet ?? 0;
        const dayPeakBet = day.ruined ? lastPlacedBet * 2 : lastPlacedBet;
        const newWorstDayBet = Math.max(prev.worstDayBet, dayPeakBet);
        if (day.ruined) return { ...prev, phase: "ruin", cumulativeExposure: newCum, worstDayBet: newWorstDayBet };
        if (prev.dayIdx >= year.length - 1) return { ...prev, phase: "done", cumulativeExposure: newCum, completedDays: prev.completedDays + 1, worstDayBet: newWorstDayBet };
        return { ...prev, dayIdx: prev.dayIdx + 1, visibleTossCount: 0, cumulativeExposure: newCum, completedDays: prev.completedDays + 1, worstDayBet: newWorstDayBet };
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [anim, tossDuration, dayPause]);

  // Derived display values
  const year = yearRef.current;
  const currentDay = year[anim.dayIdx];
  const visibleTosses = currentDay ? currentDay.tosses.slice(0, anim.visibleTossCount) : [];
  const todayPeakBet = visibleTosses[visibleTosses.length - 1]?.bet ?? 0;
  const peakBetRatio = Math.min(1, todayPeakBet / bankrollLimit);
  const dayWon = !!(currentDay && anim.visibleTossCount >= currentDay.tosses.length && !currentDay.ruined);
  const progressPct = (anim.dayIdx / DAYS) * 100;
  const trailingLosses = visibleTosses.length > 0 && visibleTosses[visibleTosses.length - 1].result === "LOSE"
    ? visibleTosses.length : 0;

  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span className="text-sm font-semibold uppercase tracking-widest text-slate-300">
            Watch It Happen
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed selector */}
          <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
            {SPEED_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSpeed(value)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  speed === value
                    ? "bg-white text-slate-900"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {anim.phase === "idle" && (
            <button
              onClick={start}
              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-semibold hover:bg-emerald-500 transition-colors"
            >
              Start
            </button>
          )}
          {(anim.phase === "running" || anim.phase === "paused") && (
            <>
              <button
                onClick={togglePause}
                className="rounded-xl bg-slate-700 px-4 py-1.5 text-sm font-semibold hover:bg-slate-600 transition-colors"
              >
                {anim.phase === "running" ? "Pause" : "Resume"}
              </button>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-700 px-4 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Reset
              </button>
            </>
          )}
          {(anim.phase === "ruin" || anim.phase === "done") && (
            <button
              onClick={start}
              className="rounded-xl bg-slate-700 px-4 py-1.5 text-sm font-semibold hover:bg-slate-600 transition-colors"
            >
              Run Again
            </button>
          )}
        </div>
      </div>

      {/* ── IDLE ───────────────────────────────────────────────────────── */}
      {anim.phase === "idle" && (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl select-none">🎲</div>
          <p className="text-xl font-semibold text-slate-100">
            Watch 365 days of Martingale betting unfold in real time
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            See every coin flip, every doubling bet, and the moment the bankroll runs dry.
          </p>
          <button
            onClick={start}
            className="mt-1 rounded-2xl bg-emerald-600 px-8 py-3 text-base font-bold hover:bg-emerald-500 transition-colors"
          >
            Start Simulation
          </button>
        </div>
      )}

      {/* ── RUNNING / PAUSED ───────────────────────────────────────────── */}
      {(anim.phase === "running" || anim.phase === "paused") && currentDay && (
        <div className="space-y-4">
          {/* Bankroll limit — always visible at top */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bankroll Limit</span>
            <span className="font-mono text-lg font-bold text-white">{fmtFull(bankrollLimit)}</span>
          </div>

          {/* Day counter + year progress */}
          <div className="flex items-center gap-4">
            <div className="shrink-0 font-mono">
              <span className="text-4xl font-black tabular-nums text-white">
                {String(anim.dayIdx + 1).padStart(3, " ")}
              </span>
              <span className="ml-1.5 text-slate-500">/ 365</span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-right text-xs text-slate-600">
                {anim.completedDays} days won (+{fmtFull(anim.completedDays * 100)})
              </p>
            </div>
            {anim.phase === "paused" && (
              <span className="shrink-0 rounded-lg bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-300">
                PAUSED
              </span>
            )}
          </div>

          {/* Main two-panel layout */}
          <div className="grid gap-4 md:grid-cols-5">
            {/* Left: toss log (3 cols) */}
            <div className="col-span-3 rounded-2xl bg-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Today&apos;s Tosses
                </p>
                {trailingLosses >= 2 && (
                  <span className="rounded-lg bg-red-900/50 px-2 py-0.5 text-xs font-bold text-red-400">
                    {trailingLosses} LOSSES IN A ROW
                  </span>
                )}
              </div>

              {visibleTosses.length === 0 ? (
                <p className="text-sm italic text-slate-600">Tossing…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {visibleTosses.map((toss, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold tabular-nums ${
                        toss.result === "WIN"
                          ? "bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700"
                          : "bg-red-900/50 text-red-300 ring-1 ring-red-800"
                      }`}
                    >
                      <span>{toss.result === "WIN" ? "✓" : "✗"}</span>
                      {toss.result} {fmtFull(toss.bet)}
                    </span>
                  ))}
                </div>
              )}

              {dayWon && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-300">
                  <span>🎉</span>
                  <span>+$100 profit — moving to next day</span>
                </div>
              )}
            </div>

            {/* Right: two distinct bet metrics (2 cols) */}
            <div className="col-span-2 flex flex-col gap-3">

              {/* ① Today's peak bet */}
              <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Today&apos;s peak bet
                </p>
                <p className="mt-2 font-mono text-3xl font-black tabular-nums leading-none text-white">
                  {fmtFull(todayPeakBet)}
                </p>
                <p className="mt-2 text-xs leading-snug text-slate-500">
                  The most you had on the table at one moment today
                </p>
                <div className="mt-3 space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${exposureBarClass(peakBetRatio)}`}
                      style={{ width: `${peakBetRatio * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-slate-600">
                    {(peakBetRatio * 100).toFixed(0)}% of {fmtShort(bankrollLimit)} limit
                  </p>
                </div>
              </div>

              {/* ② Worst day this year */}
              <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600/80">
                  Worst day this year
                </p>
                <p className="mt-2 font-mono text-3xl font-black tabular-nums leading-none text-amber-400">
                  {fmtFull(Math.max(anim.worstDayBet, todayPeakBet))}
                </p>
                <p className="mt-2 text-xs leading-snug text-slate-500">
                  The deepest your pockets needed to be — so far
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── RUIN ───────────────────────────────────────────────────────── */}
      {anim.phase === "ruin" && (() => {
        const ruinDay = year[anim.dayIdx];
        const lastBet = ruinDay?.tosses[ruinDay.tosses.length - 1]?.bet ?? 0;
        const requiredBet = lastBet * 2;
        return (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 text-center">
            <div>
              <p className="text-6xl font-black uppercase tracking-widest text-red-500">
                BANKRUPT
              </p>
              <p className="mt-2 text-base text-red-400/80">
                Day {anim.dayIdx + 1} — the streak that broke you
              </p>
            </div>

            {/* The breaking number */}
            <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-red-950/30 px-6 py-4">
              <p className="text-xs uppercase tracking-wider text-red-400/70">
                Required bet to continue
              </p>
              <p className="mt-1 font-mono text-4xl font-black text-red-400">
                {fmtFull(requiredBet)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                After {ruinDay?.tosses.length ?? 0} consecutive losses, the next bet
                would have been {fmtFull(requiredBet)} — exceeding your{" "}
                <span className="text-white">{fmtFull(bankrollLimit)} limit</span> by{" "}
                {fmtFull(requiredBet - bankrollLimit)}.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              <div className="rounded-xl bg-slate-800 px-3 py-3">
                <p className="text-xs uppercase text-slate-500">Day</p>
                <p className="mt-1 font-mono text-xl font-bold text-white">{anim.dayIdx + 1}</p>
              </div>
              <div className="rounded-xl bg-slate-800 px-3 py-3">
                <p className="text-xs uppercase text-slate-500">Days won</p>
                <p className="mt-1 font-mono text-xl font-bold text-white">{anim.completedDays}</p>
              </div>
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-3">
                <p className="text-xs uppercase text-amber-600/80">Worst bet</p>
                <p className="mt-1 font-mono text-xl font-bold text-amber-400">{fmtFull(anim.worstDayBet)}</p>
              </div>
            </div>

            <p className="max-w-sm text-sm text-slate-500">
              {anim.completedDays} winning days earned{" "}
              <span className="text-emerald-500">{fmtFull(anim.completedDays * BASE_BET)}</span>.
              One bad streak took it all.
            </p>
          </div>
        );
      })()}

      {/* ── DONE (survived 365 days) ────────────────────────────────── */}
      {anim.phase === "done" && (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-5 text-center">
          <div>
            <p className="text-5xl font-black uppercase tracking-widest text-emerald-400">
              SURVIVED
            </p>
            <p className="mt-1 text-base text-emerald-300/80">
              365 days without hitting the bankroll limit
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 rounded-2xl bg-slate-800/80 px-8 py-5">
            <div>
              <p className="text-xs uppercase text-slate-500">Days played</p>
              <p className="mt-1 font-mono text-2xl font-bold text-white">365</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total profit</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">+{fmtFull(DAYS * BASE_BET)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total wagered</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-300">{fmtFull(anim.cumulativeExposure)}</p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-slate-500">
            Lucky run — click Run Again to see how rare this is.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type SimResults = {
  lineData: { day: number; exposure: number }[];
  histData: { label: string; count: number }[];
  median: number;
  p95: number;
  ruinPct: number;
  levelCount: number;
};

export default function CoinTossCasinoPage() {
  const [bankrollStr, setBankrollStr] = useState("50000");
  const [bankrollLimit, setBankrollLimit] = useState(50_000);
  const [houseEdge, setHouseEdge] = useState<number>(0);
  const [numRunsStr, setNumRunsStr] = useState("200");
  const [numRuns, setNumRuns] = useState(200);
  const [results, setResults] = useState<SimResults | null>(null);

  const winProb = houseEdge === 0 ? 0.5 : 18 / 37;

  function commitBankroll() {
    const n = parseInt(bankrollStr.replace(/,/g, ""), 10);
    const valid = !isNaN(n) && n >= 200;
    const final = valid ? n : 50_000;
    setBankrollLimit(final);
    setBankrollStr(String(final));
  }

  function commitNumRuns() {
    const n = parseInt(numRunsStr, 10);
    const clamped = Math.min(2000, Math.max(100, isNaN(n) ? 200 : n));
    setNumRuns(clamped);
    setNumRunsStr(String(clamped));
  }

  useEffect(() => {
    const levels = martingaleLevels(bankrollLimit);

    const { dailyPeaks } = simulateYear(bankrollLimit, winProb);
    const lineData = dailyPeaks.map((exposure, i) => ({ day: i + 1, exposure }));

    const maxExposures: number[] = [];
    let ruinedRuns = 0;
    for (let i = 0; i < numRuns; i++) {
      const { maxExposure, hadRuin } = simulateYear(bankrollLimit, winProb);
      maxExposures.push(maxExposure);
      if (hadRuin) ruinedRuns++;
    }
    maxExposures.sort((a, b) => a - b);

    const median = maxExposures[Math.floor(maxExposures.length / 2)];
    const p95 = maxExposures[Math.floor(maxExposures.length * 0.95)];
    const ruinPct = (ruinedRuns / numRuns) * 100;

    const counts = new Map<number, number>(levels.map((l) => [l, 0]));
    for (const exp of maxExposures) {
      let bucket = levels[0];
      for (const l of levels) { if (exp >= l) bucket = l; }
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    const histData = levels.map((l) => ({ label: fmtShort(l), count: counts.get(l) ?? 0 }));

    setResults({ lineData, histData, median, p95, ruinPct, levelCount: levels.length });
  }, [bankrollLimit, winProb, numRuns]);

  const ruinPct = results?.ruinPct ?? 0;

  return (
    <main
      className="min-h-screen bg-slate-50 p-6"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="mx-auto max-w-4xl space-y-10">

        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <section className="pt-4">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-slate-400">
            A thought experiment about risk
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            The Coin Toss Casino
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
            <span>Created by Vikrant Gadgil</span>
            <span aria-hidden="true">·</span>
            <a href="mailto:vik76@yahoo.com" className="hover:text-slate-600 transition-colors">
              vik76@yahoo.com
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.linkedin.com/in/vikgadgil"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              LinkedIn
            </a>
          </div>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-600 max-w-2xl">
            <p>
              Imagine a casino with one game: a coin flip. Call it right, you double your
              money. Call it wrong, you lose. The odds are perfectly fair — 50/50.
            </p>
            <p>
              Your goal is simple:{" "}
              <span className="font-semibold text-slate-800">win $100 a day</span>. That&apos;s
              it. $100 × 365 days = $36,500 a year.
            </p>
            <p>
              Your strategy: start by betting $100. If you win, take your $100 profit and
              go home. If you lose, double your bet. Keep doubling until you win back your
              losses plus your $100. Then go home.
            </p>
            <p className="font-semibold text-slate-900">
              The question is: how much money do you need in your pocket to guarantee this
              works?
            </p>
          </div>
        </section>

        {/* ── Watch It Happen — hero ─────────────────────────────────────── */}
        <WatchItHappen bankrollLimit={bankrollLimit} winProb={winProb} />

        {/* ── Settings ──────────────────────────────────────────────────── */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Adjust the scenario</h2>
          <p className="mb-6 text-sm text-slate-500">
            Tweak these numbers and the charts below will update automatically.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">

            <div className="space-y-2">
              <Label htmlFor="bankroll" className="text-sm font-medium text-slate-700">
                Your bankroll ($)
              </Label>
              <Input
                id="bankroll"
                type="text"
                inputMode="numeric"
                value={bankrollStr}
                onChange={(e) => setBankrollStr(e.target.value)}
                onBlur={commitBankroll}
                onKeyDown={(e) => e.key === "Enter" && commitBankroll()}
              />
              <p className="text-xs text-slate-400">
                The most money you&apos;re willing to put at risk
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                The coin
              </Label>
              <div className="flex gap-2">
                {([
                  { label: "Perfectly fair", value: 0 },
                  { label: "Slight edge to house", value: 2.7 },
                ] as const).map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setHouseEdge(value)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      houseEdge === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {houseEdge === 0
                  ? "50/50 — truly fair"
                  : "48.65% win rate, like European roulette"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numruns" className="text-sm font-medium text-slate-700">
                How many times to run the simulation
              </Label>
              <Input
                id="numruns"
                type="text"
                inputMode="numeric"
                value={numRunsStr}
                onChange={(e) => setNumRunsStr(e.target.value)}
                onBlur={commitNumRuns}
                onKeyDown={(e) => e.key === "Enter" && commitNumRuns()}
              />
              <p className="text-xs text-slate-400">
                Running it many times shows the range of possible outcomes (100–2,000)
              </p>
            </div>

          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm leading-snug text-slate-500">
              On a typical run, your biggest single-day risk was:
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {results ? fmtFull(results.median) : "—"}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">median across all runs</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm leading-snug text-slate-500">
              In the worst 1-in-20 runs, your biggest single-day risk reached:
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {results ? fmtFull(results.p95) : "—"}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">95th percentile</span>
            </div>
          </div>

          <div className={`rounded-3xl p-6 shadow-sm ${ruinPct > 0 ? "bg-red-50" : "bg-white"}`}>
            <p className="text-sm leading-snug text-slate-500">
              Simulations where you went broke:
            </p>
            <p className={`mt-3 text-3xl font-bold ${ruinPct > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {results ? `${ruinPct.toFixed(1)}%` : "—"}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <AlertTriangle className={`h-3.5 w-3.5 ${ruinPct > 0 ? "text-red-400" : "text-emerald-400"}`} />
              <span className="text-xs text-slate-400">
                {results ? `${Math.round(ruinPct / 100 * numRuns)} of ${numRuns} simulations` : ""}
              </span>
            </div>
          </div>

        </section>

        {/* ── Charts ────────────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Your Daily Risk Over One Year
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Each spike is a bad losing streak that day
            </p>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={results?.lineData ?? []} margin={{ top: 4, right: 8, bottom: 28, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{ value: "Day 1 → Day 365", position: "insideBottom", offset: -14, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={fmtShort}
                    width={56}
                    label={{ value: "Amount at risk", angle: -90, position: "insideLeft", offset: 18, fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    formatter={(value) => [fmtFull(Number(value ?? 0)), "Amount at risk"]}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="exposure"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#0f172a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {!results && (
                <p className="mt-2 text-center text-xs text-slate-400">Computing…</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Range of Outcomes Across All Simulations
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Each bar shows how many simulations hit that peak risk level
            </p>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={results?.histData ?? []} margin={{ top: 4, right: 8, bottom: 28, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{ value: "Biggest single-day risk", position: "insideBottom", offset: -14, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    width={48}
                    label={{ value: "# of simulations", angle: -90, position: "insideLeft", offset: 16, fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} simulation${value !== 1 ? "s" : ""}`, ""]}
                    labelFormatter={(label) => `Peak risk: ${label}`}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(results?.histData ?? []).map((_entry, index) => (
                      <Cell key={index} fill={barColor(index, results?.levelCount ?? 1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="flex flex-col items-center gap-2 border-t border-slate-200 pt-8 pb-4 text-sm text-slate-400">
          <p>Created by Vikrant Gadgil</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:vik76@yahoo.com"
              className="hover:text-slate-600 transition-colors"
            >
              vik76@yahoo.com
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.linkedin.com/in/vikgadgil"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </footer>

      </div>
    </main>
  );
}
