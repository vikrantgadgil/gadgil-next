"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LadderRung = {
  year: number;
  maturityDate: string;
  annualPayout: number;
  monthlyPayout: number;
  discountRate: number;
  presentValue: number;
  percentageOfCorpus: number;
  bondType: string;
};

type LadderResult = {
  totalCorpusRequired: number;
  totalLifetimePayouts: number;
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
// Component
// ---------------------------------------------------------------------------

export function Comparison({ result }: { result: LadderResult }) {
  const annualFeeRate = 0.025; // 2.5% commercial annuity drag
  const diyFeeRate = 0.001; // 0.10% DIY ETF fees
  const totalYears = result.rungs.length;
  const monthlyPayout = result.rungs[0]?.monthlyPayout ?? 0;
  const annualPayout = monthlyPayout * 12;

  // Commercial annuity: insurer loads ~8% on top of DIY corpus
  const commercialCorpus = Math.round(result.totalCorpusRequired * 1.08);

  // Annual costs
  const diyAnnualCost = result.totalCorpusRequired * diyFeeRate;
  const commercialAnnualCost = commercialCorpus * annualFeeRate;

  // Total fees over term
  const diyTotalFees = diyAnnualCost * totalYears;
  const commercialTotalFees = commercialAnnualCost * totalYears;

  // Wealth surplus = total fees saved by DIY over the term
  const wealthSurplus = commercialTotalFees - diyTotalFees;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>DIY vs Commercial Annuity</CardTitle>
        <CardDescription>
          Compare your DIY bond ladder to a typical commercial annuity product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Metric</TableHead>
                <TableHead className="text-center">DIY Bond Ladder</TableHead>
                <TableHead className="text-center">Commercial Annuity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Monthly Payout</TableCell>
                <TableCell className="text-center font-mono">
                  {currency(monthlyPayout)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {currency(monthlyPayout)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Required Lump Sum</TableCell>
                <TableCell className="text-center font-mono">
                  {currency(result.totalCorpusRequired)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {currency(commercialCorpus)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Annual Cost</TableCell>
                <TableCell className="text-center font-mono text-emerald-600">
                  {currency(diyAnnualCost)} ({percent(diyFeeRate * 100)})
                </TableCell>
                <TableCell className="text-center font-mono text-red-600">
                  {currency(commercialAnnualCost)} ({percent(annualFeeRate * 100)})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Fees Over {totalYears} Years</TableCell>
                <TableCell className="text-center font-mono text-emerald-600">
                  {currency(diyTotalFees)}
                </TableCell>
                <TableCell className="text-center font-mono text-red-600">
                  {currency(commercialTotalFees)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Heirs Inherit</TableCell>
                <TableCell className="text-center text-emerald-600">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Remaining portfolio
                  </span>
                </TableCell>
                <TableCell className="text-center text-red-600">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    $0
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Liquidity</TableCell>
                <TableCell className="text-center text-emerald-600">
                  100% liquid
                </TableCell>
                <TableCell className="text-center text-red-600">
                  Surrender fees
                </TableCell>
              </TableRow>
              <TableRow className="bg-emerald-50">
                <TableCell className="font-semibold">Wealth Surplus</TableCell>
                <TableCell colSpan={2} className="text-center">
                  <span className="text-xl font-bold text-emerald-700">
                    +{currency(wealthSurplus)}
                  </span>
                  <p className="text-xs text-emerald-600">
                    Extra wealth retained by DIY approach over {totalYears} years
                  </p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
