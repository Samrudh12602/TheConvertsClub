"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { LineChart } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/ui/data-table";
import { adminKPIs, revenueByProduct } from "@/lib/data";
import { formatINR, formatCompactINR } from "@/lib/format";

const SUMMARY = [
  { label: "Gross revenue", value: 64300 },
  { label: "Refunds", value: -2100 },
  { label: "Gateway fees", value: -1450 },
  { label: "Mentor costs", value: -15550 },
];

const MONTHLY = [
  { label: "Dec", value: 18500 },
  { label: "Jan", value: 24800 },
  { label: "Feb", value: 21000 },
];

interface PLRow {
  id: string;
  product: string;
  revenue: number;
  cost: number;
}
const PL_ROWS: PLRow[] = revenueByProduct.map((p, i) => ({ id: String(i), product: p.label, revenue: p.value, cost: Math.round(p.value * 0.32) }));

const plColumns: Column<PLRow>[] = [
  { key: "product", header: "Product", render: (r) => r.product },
  { key: "revenue", header: "Revenue", align: "right", render: (r) => <span className="tabular-nums">{formatINR(r.revenue)}</span> },
  { key: "cost", header: "Mentor cost", align: "right", render: (r) => <span className="tabular-nums">{formatINR(r.cost)}</span> },
  { key: "margin", header: "Margin", align: "right", render: (r) => <span className="tabular-nums font-semibold text-success">{formatINR(r.revenue - r.cost)}</span> },
];

const EXPENSES = [
  { label: "Booking tool subscription", amount: 1200 },
  { label: "Instagram ads", amount: 3500 },
  { label: "Domain & hosting", amount: 800 },
];

const COUPONS = [
  { code: "EARLYBIRD10", uses: 24, discount: 21900 },
  { code: "REFER500", uses: 6, discount: 3000 },
];

export function FinanceClient() {
  const [gstOn, setGstOn] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Finance</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input type="checkbox" checked={gstOn} onChange={(e) => setGstOn(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold-500)]" />
            Show GST
          </label>
          <Button variant="outline" size="sm">
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="flex items-center gap-5">
          <ProgressRing value={adminKPIs.seasonRevenue} max={adminKPIs.seasonGoal} size={100} label={`${Math.round((adminKPIs.seasonRevenue / adminKPIs.seasonGoal) * 100)}%`} sublabel="of goal" />
          <div>
            <p className="text-xs text-muted">Season goal tracker</p>
            <p className="font-display text-xl font-bold text-ink tabular-nums mt-1">{formatCompactINR(adminKPIs.seasonRevenue)}</p>
            <p className="text-xs text-muted tabular-nums">of {formatCompactINR(adminKPIs.seasonGoal)}</p>
            {gstOn && <p className="text-[11px] text-muted mt-1">Incl. 18% GST where applicable</p>}
          </div>
        </Card>
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SUMMARY.map((s) => (
              <div key={s.label}>
                <p className="text-xs text-muted">{s.label}</p>
                <p className={`font-semibold tabular-nums mt-1 ${s.value < 0 ? "text-danger" : "text-ink"}`}>
                  {s.value < 0 ? "-" : ""}
                  {formatINR(Math.abs(s.value))}
                </p>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4 pt-3 border-t border-hairline">
              <p className="text-xs text-muted">Net margin</p>
              <p className="font-display text-xl font-bold text-success tabular-nums">{formatINR(adminKPIs.netAfterPayouts)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Monthly revenue" />
        <LineChart data={MONTHLY} />
      </Card>

      <Card>
        <CardHeader title="Per-product profit & loss" />
        <DataTable columns={plColumns} rows={PL_ROWS} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Expenses log" />
          <div className="space-y-2.5">
            {EXPENSES.map((e) => (
              <div key={e.label} className="flex items-center justify-between text-sm">
                <span className="text-ink">{e.label}</span>
                <span className="font-semibold text-ink tabular-nums">{formatINR(e.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Coupon performance" />
          <div className="space-y-2.5">
            {COUPONS.map((c) => (
              <div key={c.code} className="flex items-center justify-between text-sm">
                <div>
                  <Badge variant="outline">{c.code}</Badge>
                  <span className="text-muted ml-2">{c.uses} uses</span>
                </div>
                <span className="font-semibold text-danger tabular-nums">-{formatINR(c.discount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
