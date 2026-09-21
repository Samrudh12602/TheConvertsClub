"use client";

import { useState } from "react";
import { Download, PlayCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/data-table";
import { payoutRecords, payRates, type PayoutRecord } from "@/lib/data";
import { formatINR } from "@/lib/format";

export function PayoutsClient() {
  const [records, setRecords] = useState(payoutRecords);
  const [runOpen, setRunOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<PayoutRecord | null>(null);
  const [utr, setUtr] = useState("");

  const pending = records.filter((r) => r.status !== "Paid");
  const totalPending = pending.reduce((sum, r) => sum + r.amount, 0);

  const approve = (id: string) => setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
  const markPaid = () => {
    if (!markPaidTarget) return;
    setRecords((prev) => prev.map((r) => (r.id === markPaidTarget.id ? { ...r, status: "Paid", reference: utr || "UTR-PENDING" } : r)));
    setMarkPaidTarget(null);
    setUtr("");
  };

  const columns: Column<PayoutRecord>[] = [
    { key: "mentor", header: "Mentor", render: (r) => r.mentorName },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="tabular-nums font-semibold">{formatINR(r.amount)}</span> },
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "Paid" ? "success" : r.status === "Approved" ? "info" : "warning"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.status === "Accrued" ? (
          <Button size="sm" variant="outline" onClick={() => approve(r.id)}>
            Approve
          </Button>
        ) : r.status === "Approved" ? (
          <Button size="sm" onClick={() => setMarkPaidTarget(r)}>
            Mark paid
          </Button>
        ) : (
          <span className="text-xs text-muted">{r.reference}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Payouts</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download size={14} /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setRunOpen(true)}>
            <PlayCircle size={14} /> Create payout run
          </Button>
        </div>
      </div>

      <Card className="flex items-center gap-3 bg-sunken/40">
        <p className="text-sm text-ink">
          <strong className="tabular-nums">{formatINR(totalPending)}</strong> pending across {pending.length} accruals.
        </p>
      </Card>

      <DataTable columns={columns} rows={records} />

      <Card>
        <CardHeader title="Rate table" subtitle="Editable per tier and service" />
        <div className="grid sm:grid-cols-2 gap-6">
          {(["Junior", "Senior"] as const).map((tier) => (
            <div key={tier}>
              <Badge variant="gold" className="mb-3">
                {tier}
              </Badge>
              <div className="space-y-2.5">
                {Object.entries(payRates[tier]).map(([service, rate]) => (
                  <div key={service} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{service}</span>
                    <Input defaultValue={rate === null ? "" : String(rate)} placeholder="Not offered" className="w-28 h-9 text-right" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-4">
          Save rate table
        </Button>
      </Card>

      <Modal open={runOpen} onClose={() => setRunOpen(false)} title="Create payout run" description={`${pending.length} approved/accrued records will be included, totalling ${formatINR(totalPending)}.`}>
        <Button
          fullWidth
          onClick={() => {
            setRunOpen(false);
          }}
        >
          Confirm and run
        </Button>
      </Modal>

      <Modal open={!!markPaidTarget} onClose={() => setMarkPaidTarget(null)} title={`Mark ${markPaidTarget?.mentorName}'s payout as paid`}>
        <div className="space-y-4">
          <Input label="UTR / reference number" placeholder="e.g. UTR2609XN123" value={utr} onChange={(e) => setUtr(e.target.value)} />
          <Button fullWidth onClick={markPaid}>
            <CheckCircle2 size={15} /> Confirm paid
          </Button>
        </div>
      </Modal>
    </div>
  );
}
