"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Save,
  FolderOpen,
  Trash2,
} from "lucide-react";
import type { RetirementInputs } from "@/lib/db/schema";

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
  return `${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Row = {
  year: number;
  selfAge: number;
  spouseAge: number;
  startBalance: number;
  growth: number;
  spending: number;
  socialSecurity: number;
  endBalance: number;
};

type Scenario = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RetirementPlannerClient({ userId }: { userId: string }) {
  // ── Planner inputs ──────────────────────────────────────────────────────
  const [selfAge, setSelfAge] = useState(62);
  const [spouseAge, setSpouseAge] = useState(60);
  const [portfolio, setPortfolio] = useState(100000);
  const [annualSpending, setAnnualSpending] = useState(90000);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [returnRate, setReturnRate] = useState(5.0);
  const [longevityAge, setLongevityAge] = useState(90);
  const [ssAgeSelf, setSsAgeSelf] = useState<number | "">("");
  const [ssSelf, setSsSelf] = useState(20000);
  const [ssAgeSpouse, setSsAgeSpouse] = useState<number | "">("");
  const [ssSpouse, setSsSpouse] = useState(20000);

  // ── Save / load state ───────────────────────────────────────────────────
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    const res = await fetch("/api/scenarios");
    if (res.ok) setScenarios(await res.json());
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  function currentInputs(): RetirementInputs {
    return {
      selfAge,
      spouseAge,
      portfolio,
      annualSpending,
      inflationRate,
      returnRate,
      longevityAge,
      ssAgeSelf,
      ssSelf,
      ssAgeSpouse,
      ssSpouse,
    };
  }

  async function handleSave() {
    if (!scenarioName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: scenarioName.trim(), inputs: currentInputs() }),
      });
      if (res.ok) {
        setScenarioName("");
        await fetchScenarios();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/scenarios/${id}`);
      if (!res.ok) return;
      const scenario = await res.json();
      const inp: RetirementInputs = scenario.inputs;
      setSelfAge(inp.selfAge);
      setSpouseAge(inp.spouseAge);
      setPortfolio(inp.portfolio);
      setAnnualSpending(inp.annualSpending);
      setInflationRate(inp.inflationRate);
      setReturnRate(inp.returnRate);
      setLongevityAge(inp.longevityAge);
      setSsAgeSelf(inp.ssAgeSelf);
      setSsSelf(inp.ssSelf);
      setSsAgeSpouse(inp.ssAgeSpouse);
      setSsSpouse(inp.ssSpouse);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (res.ok) await fetchScenarios();
    } finally {
      setDeletingId(null);
    }
  }

  // ── Projection ──────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const projection: Row[] = [];
    const years = Math.max(0, longevityAge - Math.min(selfAge, spouseAge) + 1);
    let balance = portfolio;

    for (let i = 0; i < years; i++) {
      const currentSelfAge = selfAge + i;
      const currentSpouseAge = spouseAge + i;
      const startBalance = balance;
      const growth = startBalance * (returnRate / 100);
      const spending = annualSpending * Math.pow(1 + inflationRate / 100, i);

      let socialSecurity = 0;
      if (ssAgeSelf !== "" && currentSelfAge >= ssAgeSelf) {
        socialSecurity += ssSelf;
      }
      if (ssAgeSpouse !== "" && currentSpouseAge >= ssAgeSpouse) {
        socialSecurity += ssSpouse;
      }

      const endBalance = startBalance + growth + socialSecurity - spending;
      projection.push({
        year: i + 1,
        selfAge: currentSelfAge,
        spouseAge: currentSpouseAge,
        startBalance,
        growth,
        spending,
        socialSecurity,
        endBalance,
      });
      balance = endBalance;
    }

    return projection;
  }, [
    selfAge, spouseAge, portfolio, annualSpending, inflationRate, returnRate,
    longevityAge, ssAgeSelf, ssSelf, ssAgeSpouse, ssSpouse,
  ]);

  const finalRow = rows[rows.length - 1];
  const depletionRow = rows.find((r) => r.endBalance < 0);
  const status = depletionRow
    ? "Runs out before longevity target"
    : "Lasts through target age";
  const chartMax = Math.max(
    ...rows.map((r) => Math.max(r.startBalance, r.endBalance, 0)),
    1
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <Calculator className="h-4 w-4" />
                Retirement Planning
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Retirement Planner
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Model household retirement drawdown with investment growth,
                inflation-adjusted spending, and Social Security income. This is
                a planning tool, not financial advice.
              </p>
            </div>
          </div>
        </section>

        {/* Save / Load */}
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>Saved Scenarios</CardTitle>
            <CardDescription>
              Save your current inputs or load a previous scenario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Save row */}
            <div className="flex gap-2">
              <Input
                placeholder="Scenario name…"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="max-w-xs"
              />
              <button
                onClick={handleSave}
                disabled={saving || !scenarioName.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            {/* Scenario list */}
            {scenarios.length === 0 ? (
              <p className="text-sm text-slate-400">No saved scenarios yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {scenarios.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoad(s.id)}
                        disabled={loadingId === s.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {loadingId === s.id ? "Loading…" : "Load"}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === s.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-12">
          {/* ── Inputs column ── */}
          <div className="space-y-6 xl:col-span-4">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Household Inputs</CardTitle>
                <CardDescription>
                  Core profile and starting portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="selfAge">Your current age</Label>
                    <Input
                      id="selfAge"
                      type="number"
                      value={selfAge}
                      onChange={(e) => setSelfAge(Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseAge">Spouse current age</Label>
                    <Input
                      id="spouseAge"
                      type="number"
                      value={spouseAge}
                      onChange={(e) => setSpouseAge(Number(e.target.value || 0))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Current portfolio / corpus</Label>
                  <Input
                    id="portfolio"
                    type="number"
                    value={portfolio}
                    onChange={(e) => setPortfolio(Number(e.target.value || 0))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Spending & Assumptions</CardTitle>
                <CardDescription>
                  Annual need, inflation, return, and planning horizon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spending">
                    Annual spending need (today&apos;s dollars)
                  </Label>
                  <Input
                    id="spending"
                    type="number"
                    value={annualSpending}
                    onChange={(e) =>
                      setAnnualSpending(Number(e.target.value || 0))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inflation">Inflation assumption (%)</Label>
                    <Input
                      id="inflation"
                      type="number"
                      step="0.1"
                      value={inflationRate}
                      onChange={(e) =>
                        setInflationRate(Number(e.target.value || 0))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return">Expected return (%)</Label>
                    <Input
                      id="return"
                      type="number"
                      step="0.1"
                      value={returnRate}
                      onChange={(e) =>
                        setReturnRate(Number(e.target.value || 0))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longevity">Longevity target age</Label>
                  <Input
                    id="longevity"
                    type="number"
                    value={longevityAge}
                    onChange={(e) =>
                      setLongevityAge(Number(e.target.value || 0))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Social Security</CardTitle>
                <CardDescription>
                  Start age is optional. Annual amount defaults to $20,000 each.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ssAgeSelf">
                      Your SS start age (optional)
                    </Label>
                    <Input
                      id="ssAgeSelf"
                      type="number"
                      value={ssAgeSelf === "" ? "" : ssAgeSelf}
                      onChange={(e) =>
                        setSsAgeSelf(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssSelf">Your annual SS amount</Label>
                    <Input
                      id="ssSelf"
                      type="number"
                      value={ssSelf}
                      onChange={(e) => setSsSelf(Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssAgeSpouse">
                      Spouse SS start age (optional)
                    </Label>
                    <Input
                      id="ssAgeSpouse"
                      type="number"
                      value={ssAgeSpouse === "" ? "" : ssAgeSpouse}
                      onChange={(e) =>
                        setSsAgeSpouse(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssSpouse">Spouse annual SS amount</Label>
                    <Input
                      id="ssSpouse"
                      type="number"
                      value={ssSpouse}
                      onChange={(e) => setSsSpouse(Number(e.target.value || 0))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Results column ── */}
          <div className="space-y-6 xl:col-span-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <PiggyBank className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Final balance</p>
                    <p className="text-2xl font-semibold">
                      {currency(finalRow?.endBalance ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Expected return</p>
                    <p className="text-2xl font-semibold">
                      {percent(returnRate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div
                    className={`rounded-2xl p-3 ${
                      depletionRow ? "bg-amber-100" : "bg-emerald-100"
                    }`}
                  >
                    {depletionRow ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="text-base font-semibold">{status}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">Depletion point</p>
                  {depletionRow ? (
                    <>
                      <p className="text-base font-semibold">
                        Year {depletionRow.year}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Age {depletionRow.selfAge} / {depletionRow.spouseAge}
                      </p>
                    </>
                  ) : (
                    <p className="text-base font-semibold">No depletion</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Balance Trend</CardTitle>
                <CardDescription>
                  Ending portfolio balance by year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rows.map((row) => {
                    const width = `${Math.max(
                      0,
                      (Math.max(row.endBalance, 0) / chartMax) * 100
                    )}%`;
                    return (
                      <div
                        key={row.year}
                        className="grid grid-cols-[60px_1fr_140px] items-center gap-3"
                      >
                        <div className="text-sm text-slate-500">
                          Y{row.year}
                        </div>
                        <div className="h-5 rounded-full bg-slate-100">
                          <div
                            className={`h-5 rounded-full ${
                              row.endBalance < 0
                                ? "bg-amber-500"
                                : "bg-slate-900"
                            }`}
                            style={{ width }}
                          />
                        </div>
                        <div
                          className={`text-right text-sm ${
                            row.endBalance < 0
                              ? "font-medium text-amber-700"
                              : "text-slate-700"
                          }`}
                        >
                          {currency(row.endBalance)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Detailed Projection</CardTitle>
                <CardDescription>
                  Year-by-year view of growth, spending, Social Security, and
                  balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[560px] overflow-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Your Age</TableHead>
                        <TableHead>Spouse Age</TableHead>
                        <TableHead>Start Balance</TableHead>
                        <TableHead>Growth</TableHead>
                        <TableHead>Spending</TableHead>
                        <TableHead>Social Security</TableHead>
                        <TableHead>End Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.selfAge}</TableCell>
                          <TableCell>{row.spouseAge}</TableCell>
                          <TableCell>{currency(row.startBalance)}</TableCell>
                          <TableCell>{currency(row.growth)}</TableCell>
                          <TableCell>{currency(row.spending)}</TableCell>
                          <TableCell>{currency(row.socialSecurity)}</TableCell>
                          <TableCell
                            className={
                              row.endBalance < 0
                                ? "font-semibold text-amber-700"
                                : "font-medium"
                            }
                          >
                            {currency(row.endBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
