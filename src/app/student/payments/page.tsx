import { Download, CreditCard } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentStudent, packages } from "@/lib/data";
import { formatINR } from "@/lib/format";

const INVOICES = [
  { id: "inv-1", label: "Call Convert package", date: "5 Jan 2026", amount: 2199 },
  { id: "inv-2", label: "Additional PI", date: "18 Jan 2026", amount: 449 },
];

const LEDGER = [
  { label: "Mock PI credit used — Session with Ishaan Kapoor", date: "15 Sep", change: -1 },
  { label: "SOP review credit used — Detailed review", date: "10 Jan", change: -1 },
  { label: "Package purchased — Call Convert", date: "5 Jan", change: 4 },
];

export default function PaymentsPage() {
  const activePackage = packages.find((p) => p.name === currentStudent.package);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Payments & plan</h1>

      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current package</p>
          <p className="font-display text-xl font-semibold text-ink mt-1">{currentStudent.package}</p>
          {activePackage && <p className="text-sm text-muted mt-0.5">{formatINR(activePackage.price)} · purchased 5 Jan 2026</p>}
        </div>
        <ButtonLink href="/student/book" variant="outline">
          Add a session
        </ButtonLink>
      </Card>

      <Card>
        <CardHeader title="Credits ledger" />
        <div className="space-y-3">
          {LEDGER.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-ink">{entry.label}</p>
                <p className="text-xs text-muted">{entry.date}</p>
              </div>
              <span className={`font-semibold tabular-nums ${entry.change > 0 ? "text-success" : "text-ink"}`}>
                {entry.change > 0 ? `+${entry.change}` : entry.change}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Invoices" />
        <div className="divide-y divide-hairline">
          {INVOICES.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{inv.label}</p>
                <p className="text-xs text-muted">{inv.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-ink tabular-nums">{formatINR(inv.amount)}</span>
                <button className="text-muted hover:text-brand">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Have a coupon?" />
        <div className="flex gap-3">
          <Input placeholder="Enter coupon code" className="flex-1" />
          <Button variant="outline">Apply</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Payment method" action={<Badge variant="outline">Razorpay</Badge>} />
        <div className="flex items-center gap-3 text-sm text-muted">
          <CreditCard size={18} /> Payments are processed securely via Razorpay. No card details are stored on our servers.
        </div>
      </Card>
    </div>
  );
}
