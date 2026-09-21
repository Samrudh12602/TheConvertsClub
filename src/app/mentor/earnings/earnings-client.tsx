"use client";

import { useState } from "react";
import { Download, Pencil, Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/stepper";
import { LineChart } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/ui/data-table";
import { currentMentor, payRates, bonusTiers, payoutRecords } from "@/lib/data";
import { formatINR } from "@/lib/format";

const MONTHLY = [
  { label: "Nov", value: 4200 },
  { label: "Dec", value: 6800 },
  { label: "Jan", value: 8900 },
  { label: "Feb", value: 9600 },
];

interface EarningRow {
  id: string;
  date: string;
  student: string;
  type: string;
  rate: number;
  status: "Accrued" | "Approved" | "Paid";
}

const ROWS: EarningRow[] = [
  { id: "e1", date: "20 Sep", student: "AM", type: "Mock PI", rate: 400, status: "Accrued" },
  { id: "e2", date: "18 Sep", student: "VS", type: "Mock GD/GE", rate: 200, status: "Accrued" },
  { id: "e3", date: "15 Sep", student: "AM", type: "Mock PI", rate: 400, status: "Approved" },
  { id: "e4", date: "31 Aug", student: "SK", type: "Guidance call", rate: 250, status: "Paid" },
];

const columns: Column<EarningRow>[] = [
  { key: "date", header: "Date", render: (r) => r.date },
  { key: "student", header: "Student", render: (r) => r.student },
  { key: "type", header: "Type", render: (r) => r.type },
  { key: "rate", header: "Rate", align: "right", render: (r) => formatINR(r.rate) },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={r.status === "Paid" ? "success" : r.status === "Approved" ? "info" : "warning"}>{r.status}</Badge>,
  },
];

export function EarningsClient() {
  const rates = payRates[currentMentor.tier];
  const bonus = bonusTiers[currentMentor.tier];
  const mentorPayouts = payoutRecords.filter((p) => p.mentorId === currentMentor.id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Earnings & pay</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Accrued", value: currentMentor.earningsAccrued },
          { label: "Pending approval", value: 3100 },
          { label: "Paid this month", value: 6500 },
          { label: "Lifetime", value: currentMentor.earningsPaid },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="font-display text-lg font-bold text-ink tabular-nums mt-1">{formatINR(s.value)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Your pay structure" subtitle={`${currentMentor.tier} rate card`} action={<Badge variant="gold">{currentMentor.tier}</Badge>} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(rates).map(([service, rate]) => (
            <div key={service} className="rounded-[var(--radius-md)] border border-hairline p-3">
              <p className="text-xs text-muted">{service}</p>
              <p className="font-semibold text-ink mt-1 tabular-nums">{rate === null ? "Not offered" : formatINR(rate)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Monthly earnings" />
        <LineChart data={MONTHLY} />
      </Card>

      <Card>
        <CardHeader title="Bonus tiers" subtitle={`${currentMentor.mocksThisSeason} mocks completed this season`} />
        <div className="space-y-4">
          {bonus.map((tier) => {
            const reached = currentMentor.mocksThisSeason >= tier.mocks;
            const pct = Math.min(100, (currentMentor.mocksThisSeason / tier.mocks) * 100);
            return (
              <div key={tier.mocks}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={reached ? "text-success font-semibold" : "text-ink"}>{tier.mocks} mocks</span>
                  <span className="font-semibold text-ink tabular-nums">{formatINR(tier.bonus)}</span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Earnings by session" />
        <DataTable columns={columns} rows={ROWS} />
      </Card>

      <Card>
        <CardHeader title="Payout history" />
        <div className="divide-y divide-hairline">
          {mentorPayouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{formatINR(p.amount)}</p>
                <p className="text-xs text-muted">
                  {p.date} {p.reference && `· Ref ${p.reference}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={p.status === "Paid" ? "success" : p.status === "Approved" ? "info" : "warning"}>{p.status}</Badge>
                {p.status === "Paid" && (
                  <button className="text-muted hover:text-brand">
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payout details</p>
          <p className="text-sm font-medium text-ink mt-1">UPI · ish••••@okhdfc</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil size={13} /> Edit
        </Button>
      </Card>

      <Card className="flex items-start gap-3 bg-sunken/40">
        <Info size={18} className="text-brand shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink">How your pay works</p>
          <p className="text-sm text-muted mt-1">
            Rates are set per your tier and service. Earnings accrue when you submit feedback, move to Approved after Admin review, and are paid out
            monthly to your UPI or bank account. Bonuses unlock automatically at each mock milestone.
          </p>
        </div>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update payout details">
        <div className="space-y-4">
          <Input label="UPI ID" placeholder="yourname@bank" defaultValue="ishaan.kapoor@okhdfc" />
          <Button fullWidth onClick={() => setEditOpen(false)}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
