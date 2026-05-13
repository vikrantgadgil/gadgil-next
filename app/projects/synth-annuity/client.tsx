"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, Loader2 } from "lucide-react";
import { Comparison } from "./components/Comparison";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BondType =
  | "T-Bill / SGOV"
  | "1-3Y iBonds IBTE"
  | "3-7Y IBTI"
  | "7-10Y IBTM"
  | "10-20Y IBTL"
  | "Long T-Bond TLT";

type LadderRung = {
  year: number;
  maturityDate: string;
  annualPayout: number;
  monthlyPayout: number;
  discountRate: number;
  presentValue: number;
  percentageOfCorpus: number;
  bondType: BondType;
};

type LadderResult = {
  totalCorpusRequired: number;
  totalLifetimePayouts: number;
  implementationGuide?: string;
  rungs: LadderRung[];
};

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// GoalCapture Component
// ---------------------------------------------------------------------------

function GoalCapture({
  monthlyPayout,
  setMonthlyPayout,
  durationYears,
  setDurationYears,
  mode,
  setMode,
  onCalculate,
  loading,
}: {
  monthlyPayout: number;
  setMonthlyPayout: (v: number) => void;
  durationYears: number;
  setDurationYears: (v: number) => void;
  mode: string;
  setMode: (v: string) => void;
  onCalculate: () => void;
  loading: boolean;
}) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Your Annuity Goal</CardTitle>
        <CardDescription>
          Tell us how much monthly income you need and for how long.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monthlyPayout">Target monthly payout ($)</Label>
          <Input
            id="monthlyPayout"
            type="number"
            min={100}
            step={100}
            value={monthlyPayout}
            onChange={(e) => setMonthlyPayout(Number(e.target.value || 0))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationYears">Duration (years)</Label>
          <Input
            id="durationYears"
            type="number"
            min={1}
            max={50}
            step={1}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value || 0))}
          />
        </div>

        <div className="space-y-2">
          <Label>Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Principal Protected">
                Principal Protected
              </SelectItem>
              <SelectItem value="Growth Optimized">
                Growth Optimized
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">
            {mode === "Principal Protected"
              ? "Your entire corpus is returned to you or your heirs at the end of the term."
              : "Higher potential returns with some principal at risk."}
          </p>
        </div>

        <Button
          onClick={onCalculate}
          disabled={loading || monthlyPayout <= 0 || durationYears <= 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Building Ladder…
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5" />
              Build My Annuity
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// LadderTable Component
// ---------------------------------------------------------------------------

function LadderTable({ result }: { result: LadderResult }) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Your Bond Ladder</CardTitle>
        <CardDescription>
          A zero-coupon bond ladder built with US Treasury securities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl border-0 bg-slate-50 shadow-none">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Corpus Required</p>
              <p className="text-2xl font-semibold text-slate-900">
                {currency(result.totalCorpusRequired)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 bg-slate-50 shadow-none">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Lifetime Payouts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {currency(result.totalLifetimePayouts)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rungs table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Maturity Date</TableHead>
                <TableHead>Monthly Payout</TableHead>
                <TableHead>Discount Rate</TableHead>
                <TableHead>Bond Type</TableHead>
                <TableHead className="text-right">Cost Today</TableHead>
                <TableHead className="text-right">% of Corpus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rungs.map((rung) => (
                <TableRow key={rung.year}>
                  <TableCell className="font-medium">{rung.year}</TableCell>
                  <TableCell className="text-slate-500">
                    {rung.maturityDate}
                  </TableCell>
                  <TableCell>{currency(rung.monthlyPayout)}</TableCell>
                  <TableCell>{percent(rung.discountRate)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {rung.bondType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {currency(rung.presentValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {percent(rung.percentageOfCorpus)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ImplementationGuide Component
// ---------------------------------------------------------------------------

function ImplementationGuide({
  guide,
  result,
}: {
  guide: string;
  result: LadderResult;
}) {
  const totalYears = result.rungs.length;
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Implementation Guide</CardTitle>
        <CardDescription>
          How to build this portfolio with real ETFs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-slate-600">{guide}</p>
        <p className="mt-3 text-xs text-slate-400">
          This portfolio uses a bond ladder built with US Treasury securities
          across {totalYears} rungs. Each rung represents a zero-coupon bond
          that matures in a specific year, providing a known payout at maturity.
          The ladder is constructed using a mix of T-Bills (SGOV), iBonds ETFs
          (IBTE, IBTI, IBTM, IBTL), and long-term Treasury bonds (TLT) to match
          the duration of each rung.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export function SynthAnnuityClient() {
  const [monthlyPayout, setMonthlyPayout] = useState(5000);
  const [durationYears, setDurationYears] = useState(20);
  const [mode, setMode] = useState("Principal Protected");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LadderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/synth-annuity/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMonthlyPayout: monthlyPayout,
          durationYears,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Calculation failed");
      }

      const data: LadderResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <Calculator className="h-4 w-4" />
                SynthAnnuity
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Synthetic Annuity Builder
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Build your own annuity using a US Treasury bond ladder. No
                insurance company, no fees, no fine print — just guaranteed
                income from the full faith and credit of the US government.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-12">
          {/* Left column: Goal Capture */}
          <div className="xl:col-span-4">
            <GoalCapture
              monthlyPayout={monthlyPayout}
              setMonthlyPayout={setMonthlyPayout}
              durationYears={durationYears}
              setDurationYears={setDurationYears}
              mode={mode}
              setMode={setMode}
              onCalculate={handleCalculate}
              loading={loading}
            />
          </div>

          {/* Right column: Results */}
          <div className="space-y-6 xl:col-span-8">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!result && !error && (
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Calculator className="mb-4 h-12 w-12 text-slate-300" />
                  <p className="text-lg font-medium text-slate-500">
                    Enter your goal and click &ldquo;Build My Annuity&rdquo;
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    See your personalized bond ladder and compare it to a
                    commercial annuity.
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <LadderTable result={result} />
                <Comparison result={result} />
                <ImplementationGuide
                  guide={
                    result.implementationGuide ??
                    "This portfolio uses a bond ladder built with US Treasury securities. Each rung represents a zero-coupon bond that matures in a specific year, providing a known payout at maturity. By holding bonds to maturity, you eliminate interest rate risk and guarantee your income stream."
                  }
                  result={result}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
