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
  Plus,
} from "lucide-react";
import type { Account, AccountType, IncomeStream, RetirementInputs } from "@/lib/db/schema";
import { ACCOUNT_TYPE_LABELS } from "@/lib/db/schema";

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

type ProjectionRow = {
  year: number;
  selfAge: number;
  spouseAge: number;
  startBalance: number;
  growth: number;
  spending: number;
  socialSecurity: number;
  otherIncome: number;
  federalTax: number;
  grossWithdrawal: number;
  endBalance: number;
};

type Scenario = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newAccount(): Account {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "taxable",
    balance: 0,
    returnRate: 5.0,
  };
}

function newIncomeStream(): IncomeStream {
  return {
    id: crypto.randomUUID(),
    name: "",
    annualAmount: 0,
    startAge: 0,
    endAge: "",
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Tax helper functions
// ──────────────────────────────────────────────────────────────────────────

function getTaxBrackets(filingStatus: "single" | "mfj"): [number, number][] {
  if (filingStatus === "single") {
    return [
      [11600, 0.10],
      [47150, 0.12],
      [100525, 0.22],
      [191950, 0.24],
      [243725, 0.32],
      [609350, 0.35],
      [Infinity, 0.37],
    ];
  } else {
    return [
      [23200, 0.10],
      [94300, 0.12],
      [201050, 0.22],
      [383900, 0.24],
      [487450, 0.32],
      [731200, 0.35],
      [Infinity, 0.37],
    ];
  }
}

function calculateOrdinaryTax(ordinaryIncome: number, filingStatus: "single" | "mfj"): number {
  if (ordinaryIncome <= 0) return 0;

  const brackets = getTaxBrackets(filingStatus);
  let tax = 0;
  let prevLimit = 0;

  for (const [limit, rate] of brackets) {
    if (ordinaryIncome <= prevLimit) break;
    const taxableInBracket = Math.min(ordinaryIncome, limit) - prevLimit;
    tax += taxableInBracket * rate;
    prevLimit = limit;
  }

  return tax;
}

function calculateSSTax(ssIncome: number, otherIncome: number, filingStatus: "single" | "mfj"): { taxableAmount: number; tax: number } {
  const threshold = filingStatus === "single" ? 34000 : 44000;
  const combinedIncome = otherIncome + ssIncome + (0.5 * ssIncome);

  if (combinedIncome <= threshold) {
    return { taxableAmount: 0, tax: 0 };
  }

  const taxableAmount = Math.min(0.85 * ssIncome, 0.5 * (combinedIncome - threshold));
  return { taxableAmount, tax: 0 }; // Tax will be calculated as part of ordinary income
}

function calculateLTCGTax(gains: number): number {
  return gains * 0.15;
}

function calculateRMD(age: number, balance: number): number {
  if (age < 73) return 0;
  const divisor = 27.4 - (age - 73) * 0.4;
  return Math.max(0, balance / divisor);
}

function calculateGrossUpWithdrawal(netNeeded: number, ordinaryIncomeSoFar: number, filingStatus: "single" | "mfj"): number {
  if (netNeeded <= 0) return 0;

  // Initial guess
  let grossWithdrawal = netNeeded / 0.76; // Assume ~24% marginal rate initially

  for (let i = 0; i < 5; i++) {
    const totalOrdinary = ordinaryIncomeSoFar + grossWithdrawal;
    const taxOnTotal = calculateOrdinaryTax(totalOrdinary, filingStatus);
    const taxOnCurrent = calculateOrdinaryTax(ordinaryIncomeSoFar, filingStatus);
    const taxOnGross = taxOnTotal - taxOnCurrent;
    const netFromGross = grossWithdrawal - taxOnGross;

    if (Math.abs(netFromGross - netNeeded) < 1) {
      return grossWithdrawal;
    }

    // Adjust: if we're getting more net than needed, reduce gross
    if (netFromGross > netNeeded) {
      grossWithdrawal *= netNeeded / netFromGross;
    } else {
      grossWithdrawal *= netNeeded / netFromGross;
    }
  }

  return grossWithdrawal;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: crypto.randomUUID(),
    name: "Primary Portfolio",
    type: "taxable",
    balance: 100000,
    returnRate: 5.0,
  },
];

export function RetirementPlannerClient({ userId }: { userId: string }) {
  // ── Planner inputs ──────────────────────────────────────────────────────
  const [selfAge, setSelfAge] = useState(62);
  const [spouseAge, setSpouseAge] = useState(60);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [annualSpending, setAnnualSpending] = useState(90000);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [longevityAge, setLongevityAge] = useState(90);
  const [ssAgeSelf, setSsAgeSelf] = useState<number | "">("");
  const [ssSelf, setSsSelf] = useState(20000);
  const [ssAgeSpouse, setSsAgeSpouse] = useState<number | "">("");
  const [ssSpouse, setSsSpouse] = useState(20000);
  const [filingStatus, setFilingStatus] = useState<"single" | "mfj">("single");

  // ── Account helpers ─────────────────────────────────────────────────────
  function addAccount() {
    setAccounts((prev) => [...prev, newAccount()]);
  }

  function removeAccount(id: string) {
    setAccounts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((a) => a.id !== id);
    });
  }

  function updateAccount(id: string, patch: Partial<Omit<Account, "id">>) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }

  // ── Income stream state & helpers ────────────────────────────────────────
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([]);

  function addIncomeStream() {
    setIncomeStreams((prev) => [...prev, newIncomeStream()]);
  }

  function removeIncomeStream(id: string) {
    setIncomeStreams((prev) => prev.filter((s) => s.id !== id));
  }

  function updateIncomeStream(id: string, patch: Partial<Omit<IncomeStream, "id">>) {
    setIncomeStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

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
      accounts,
      annualSpending,
      inflationRate,
      longevityAge,
      ssAgeSelf,
      ssSelf,
      ssAgeSpouse,
      ssSpouse,
      incomeStreams,
      filingStatus,
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
      setAccounts(inp.accounts);
      setAnnualSpending(inp.annualSpending);
      setInflationRate(inp.inflationRate);
      setLongevityAge(inp.longevityAge);
      setSsAgeSelf(inp.ssAgeSelf);
      setSsSelf(inp.ssSelf);
      setSsAgeSpouse(inp.ssAgeSpouse);
      setSsSpouse(inp.ssSpouse);
      setIncomeStreams(inp.incomeStreams ?? []);
      setFilingStatus(inp.filingStatus ?? "single");
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

  // ── Derived portfolio values ─────────────────────────────────────────────
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const blendedReturn = useMemo(
    () =>
      totalBalance > 0
        ? accounts.reduce((sum, a) => sum + a.balance * a.returnRate, 0) /
          totalBalance
        : 0,
    [accounts, totalBalance]
  );

  // ── Projection ──────────────────────────────────────────────────────────
  // Implements withdrawal sequencing: Taxable → Traditional (with gross-up) → Roth
  // Applies federal tax calculations including SS taxation and LTCG.
  const rows = useMemo(() => {
    const projection: ProjectionRow[] = [];
    const years = Math.max(0, longevityAge - Math.min(selfAge, spouseAge) + 1);

    // Working balances — one entry per account, mutated each year.
    let balances = accounts.map((a) => a.balance);

    for (let i = 0; i < years; i++) {
      const currentSelfAge = selfAge + i;
      const currentSpouseAge = spouseAge + i;

      const startBalance = balances.reduce((s, b) => s + b, 0);

      // Per-account growth, summed for the projection row.
      const growths = accounts.map((a, idx) => balances[idx] * (a.returnRate / 100));
      const totalGrowth = growths.reduce((s, g) => s + g, 0);

      const spending = annualSpending * Math.pow(1 + inflationRate / 100, i);

      let socialSecurity = 0;
      if (ssAgeSelf !== "" && currentSelfAge >= ssAgeSelf) socialSecurity += ssSelf;
      if (ssAgeSpouse !== "" && currentSpouseAge >= ssAgeSpouse) socialSecurity += ssSpouse;

      // Sum income streams active this year (keyed off selfAge).
      const otherIncome = incomeStreams.reduce((sum, s) => {
        const active =
          currentSelfAge >= s.startAge &&
          (s.endAge === "" || currentSelfAge <= s.endAge);
        return active ? sum + s.annualAmount : sum;
      }, 0);

      // Balances after growth.
      const afterGrowth = balances.map((b, idx) => b + growths[idx]);

      // ── Withdrawal sequencing & tax calculation ────────────────────────
      let ltcgTax = 0;          // LTCG tax on Taxable withdrawals (subtracted from endBalance)
      let traditionalTax = 0;   // Tax on Traditional withdrawals (embedded in gross-up, not subtracted)
      let grossWithdrawal = 0;
      let ordinaryTaxableIncome = 0;
      let totalNeeded = Math.max(0, spending - socialSecurity - otherIncome);

      if (totalNeeded > 0) {
        // Step 1: Withdraw from Taxable accounts (LTCG tax is SEPARATE outflow)
        const taxableIndices = accounts.map((a, idx) => (a.type === "taxable" ? idx : -1)).filter(idx => idx >= 0);
        for (const idx of taxableIndices) {
          if (totalNeeded <= 0) break;
          const taxableWithdrawal = Math.min(totalNeeded, afterGrowth[idx]);
          afterGrowth[idx] -= taxableWithdrawal;
          grossWithdrawal += taxableWithdrawal;

          // LTCG tax is a separate outflow from the portfolio
          const gains = taxableWithdrawal * 0.5;
          ltcgTax += calculateLTCGTax(gains);
          totalNeeded -= taxableWithdrawal;
        }

        // Step 2: Withdraw from Traditional accounts (tax embedded in gross-up)
        if (totalNeeded > 0) {
          const traditionalIndices = accounts.map((a, idx) => (a.type === "traditional" ? idx : -1)).filter(idx => idx >= 0);
          const totalTraditionalBalance = traditionalIndices.reduce((sum, idx) => sum + afterGrowth[idx], 0);

          if (totalTraditionalBalance > 0) {
            const ssTaxInfo = calculateSSTax(socialSecurity, otherIncome, filingStatus);
            const ordinaryIncomeSoFar = otherIncome + ssTaxInfo.taxableAmount;

            const traditionalGross = calculateGrossUpWithdrawal(totalNeeded, ordinaryIncomeSoFar, filingStatus);
            const availableTraditional = totalTraditionalBalance;

            if (traditionalGross <= availableTraditional) {
              for (const idx of traditionalIndices) {
                const share = afterGrowth[idx] / totalTraditionalBalance;
                const amountFromThisAccount = traditionalGross * share;
                afterGrowth[idx] -= amountFromThisAccount;
              }
              ordinaryTaxableIncome += traditionalGross;
              grossWithdrawal += traditionalGross;

              // Calculate the embedded tax (for reporting, not portfolio subtraction)
              const taxWithTraditional = calculateOrdinaryTax(ordinaryIncomeSoFar + traditionalGross, filingStatus);
              const taxWithoutTraditional = calculateOrdinaryTax(ordinaryIncomeSoFar, filingStatus);
              traditionalTax = taxWithTraditional - taxWithoutTraditional;

              totalNeeded = 0;
            } else {
              for (const idx of traditionalIndices) {
                ordinaryTaxableIncome += afterGrowth[idx];
                grossWithdrawal += afterGrowth[idx];
                afterGrowth[idx] = 0;
              }
              totalNeeded -= availableTraditional;
            }
          }
        }

        // Step 3: Withdraw from Roth accounts (tax-free)
        if (totalNeeded > 0) {
          const rothIndices = accounts.map((a, idx) => (a.type === "roth" ? idx : -1)).filter(idx => idx >= 0);
          for (const idx of rothIndices) {
            if (totalNeeded <= 0) break;
            const rothWithdrawal = Math.min(totalNeeded, afterGrowth[idx]);
            afterGrowth[idx] -= rothWithdrawal;
            grossWithdrawal += rothWithdrawal;
            totalNeeded -= rothWithdrawal;
          }
        }
      }

      // Calculate tax on external income (SS + Other Income)
      // This is always a portfolio outflow, even if no withdrawals are needed
      const ssTaxInfo = calculateSSTax(socialSecurity, otherIncome, filingStatus);
      const taxOnExternalIncome = calculateOrdinaryTax(otherIncome + ssTaxInfo.taxableAmount, filingStatus);

      // Calculate tax on Traditional withdrawals (if any)
      // This is embedded in the gross-up, not separately subtracted
      let taxOnTraditionalWithdrawals = 0;
      if (ordinaryTaxableIncome > 0) {
        const taxWithTraditional = calculateOrdinaryTax(ordinaryTaxableIncome + otherIncome + ssTaxInfo.taxableAmount, filingStatus);
        taxOnTraditionalWithdrawals = taxWithTraditional - taxOnExternalIncome;
      }

      // Federal tax for display = all taxes owed (LTCG + external income + embedded Traditional)
      const federalTax = ltcgTax + taxOnExternalIncome + taxOnTraditionalWithdrawals;

      // Calculate end balance using cash-flow formula: Start + Growth + Income - Spending - Tax
      const portfolioAfterWithdrawals = afterGrowth.reduce((s, b) => s + b, 0);
      const endBalance = startBalance + totalGrowth + socialSecurity + otherIncome - spending - federalTax;

      // Update account balances for next year
      // Distribute the tax payment proportionally across accounts based on their share
      if (portfolioAfterWithdrawals > 0) {
        const totalTaxPaid = federalTax;
        balances = afterGrowth.map((b) => b - totalTaxPaid * (b / portfolioAfterWithdrawals));
      } else {
        balances = afterGrowth;
      }

      projection.push({
        year: i + 1,
        selfAge: currentSelfAge,
        spouseAge: currentSpouseAge,
        startBalance,
        growth: totalGrowth,
        spending,
        socialSecurity,
        otherIncome,
        federalTax,
        grossWithdrawal,
        endBalance,
      });
    }

    return projection;
  }, [
    accounts, selfAge, spouseAge, annualSpending, inflationRate,
    longevityAge, ssAgeSelf, ssSelf, ssAgeSpouse, ssSpouse, incomeStreams, filingStatus,
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

            {/* Household Inputs */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Household Inputs</CardTitle>
                <CardDescription>Ages and planning horizon</CardDescription>
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
                  <Label htmlFor="filingStatus">Tax filing status</Label>
                  <select
                    id="filingStatus"
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value as "single" | "mfj")}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="single">Single</option>
                    <option value="mfj">Married Filing Jointly</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Investment Accounts */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Investment Accounts</CardTitle>
                <CardDescription>
                  Add each account with its own balance and expected annual return.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_140px_88px_72px_32px] items-center gap-2 px-1">
                  <span className="text-xs font-medium text-slate-500">Account name</span>
                  <span className="text-xs font-medium text-slate-500">Type</span>
                  <span className="text-xs font-medium text-slate-500">Balance ($)</span>
                  <span className="text-xs font-medium text-slate-500">Return (%)</span>
                  <span />
                </div>

                {/* Account rows */}
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="grid grid-cols-[1fr_140px_88px_72px_32px] items-center gap-2"
                    >
                      <Input
                        value={account.name}
                        placeholder="e.g. Vanguard IRA"
                        onChange={(e) =>
                          updateAccount(account.id, { name: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                      <select
                        value={account.type}
                        onChange={(e) =>
                          updateAccount(account.id, {
                            type: e.target.value as AccountType,
                          })
                        }
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {(Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][]).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                      <Input
                        type="number"
                        value={account.balance}
                        onChange={(e) =>
                          updateAccount(account.id, {
                            balance: Number(e.target.value || 0),
                          })
                        }
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={account.returnRate}
                        onChange={(e) =>
                          updateAccount(account.id, {
                            returnRate: Number(e.target.value || 0),
                          })
                        }
                        className="h-8 text-sm"
                      />
                      <button
                        onClick={() => removeAccount(account.id)}
                        disabled={accounts.length <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer: add button + total */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={addAccount}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add account
                  </button>
                  <span className="text-sm font-medium text-slate-700">
                    Total:{" "}
                    <span className="font-semibold">{currency(totalBalance)}</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Spending & Assumptions */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Spending & Assumptions</CardTitle>
                <CardDescription>
                  Annual need, inflation, and planning horizon
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

            {/* Social Security */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Social Security</CardTitle>
                <CardDescription>
                  Set a start age to include SS income in the projection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ssAgeSelf">Your SS start age</Label>
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
                    <Label
                      htmlFor="ssSelf"
                      className={ssAgeSelf === "" ? "text-slate-400" : ""}
                    >
                      Your annual SS amount
                    </Label>
                    <Input
                      id="ssSelf"
                      type="number"
                      value={ssSelf}
                      disabled={ssAgeSelf === ""}
                      onChange={(e) => setSsSelf(Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssAgeSpouse">Spouse SS start age</Label>
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
                    <Label
                      htmlFor="ssSpouse"
                      className={ssAgeSpouse === "" ? "text-slate-400" : ""}
                    >
                      Spouse annual SS amount
                    </Label>
                    <Input
                      id="ssSpouse"
                      type="number"
                      value={ssSpouse}
                      disabled={ssAgeSpouse === ""}
                      onChange={(e) => setSsSpouse(Number(e.target.value || 0))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Income Streams */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Income Streams</CardTitle>
                <CardDescription>
                  Pension, rental income, part-time work, annuities, etc.
                  Amounts are nominal (not inflation-adjusted). Ages reference your age.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomeStreams.length === 0 ? (
                  <p className="text-sm text-slate-400">No income streams added.</p>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_88px_72px_72px_32px] items-center gap-2 px-1">
                      <span className="text-xs font-medium text-slate-500">Name</span>
                      <span className="text-xs font-medium text-slate-500">Annual ($)</span>
                      <span className="text-xs font-medium text-slate-500">Start age</span>
                      <span className="text-xs font-medium text-slate-500">End age</span>
                      <span />
                    </div>

                    {/* Stream rows */}
                    <div className="space-y-2">
                      {incomeStreams.map((stream) => (
                        <div
                          key={stream.id}
                          className="grid grid-cols-[1fr_88px_72px_72px_32px] items-center gap-2"
                        >
                          <Input
                            value={stream.name}
                            placeholder="e.g. Pension"
                            onChange={(e) =>
                              updateIncomeStream(stream.id, { name: e.target.value })
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            value={stream.annualAmount}
                            onChange={(e) =>
                              updateIncomeStream(stream.id, {
                                annualAmount: Number(e.target.value || 0),
                              })
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            value={stream.startAge}
                            onChange={(e) =>
                              updateIncomeStream(stream.id, {
                                startAge: Number(e.target.value || 0),
                              })
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="∞"
                            value={stream.endAge === "" ? "" : stream.endAge}
                            onChange={(e) =>
                              updateIncomeStream(stream.id, {
                                endAge: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                            className="h-8 text-sm"
                          />
                          <button
                            onClick={() => removeIncomeStream(stream.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="Remove income stream"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={addIncomeStream}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add stream
                </button>
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
                    <p className="text-sm text-slate-500">Blended return</p>
                    <p className="text-2xl font-semibold">
                      {percent(blendedReturn)}
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
                  Year-by-year view of growth, spending, Social Security, income, taxes, and balance
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
                        <TableHead>Other Income</TableHead>
                        <TableHead title="Traditional withdrawal taxes are embedded in the gross withdrawal. LTCG taxes are a separate portfolio outflow.">
                          Est. Federal Tax
                        </TableHead>
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
                          <TableCell>{currency(row.otherIncome)}</TableCell>
                          <TableCell>{currency(row.federalTax)}</TableCell>
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
