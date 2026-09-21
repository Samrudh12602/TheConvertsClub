import Link from "next/link";
import { AlertCircle, UserPlus, CreditCard, UserX, FileWarning, Plus, CalendarRange, Users2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BarChart, LineChart, Funnel } from "@/components/ui/charts";
import { adminKPIs, revenueByProduct, sessionsPerWeek, conversionFunnel } from "@/lib/data";
import { formatCompactINR, formatINR } from "@/lib/format";

const NEEDS_ATTENTION = [
  { icon: CalendarRange, label: "9 unassigned sessions", href: "/admin/scheduler", tone: "danger" as const },
  { icon: FileWarning, label: "4 overdue feedback reports", href: "/admin/reviews", tone: "warning" as const },
  { icon: CreditCard, label: "2 failed payments", href: "/admin/finance", tone: "danger" as const },
  { icon: UserX, label: "1 no-show reported today", href: "/admin/sessions", tone: "warning" as const },
  { icon: UserPlus, label: "2 new mentor applications", href: "/admin/applications", tone: "info" as const },
  { icon: AlertCircle, label: "3 students below 1 credit remaining", href: "/admin/students", tone: "warning" as const },
];

const QUICK_ACTIONS = [
  { label: "Add student", href: "/admin/students" },
  { label: "Invite mentor", href: "/admin/mentors" },
  { label: "Create GD batch", href: "/admin/scheduler" },
  { label: "Record payout", href: "/admin/payouts" },
];

export default function AdminCommandCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Command center</h1>
        <p className="text-sm text-muted mt-1">Season snapshot and what needs your attention right now.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="col-span-2 flex items-center gap-4">
          <ProgressRing
            value={adminKPIs.seasonRevenue}
            max={adminKPIs.seasonGoal}
            size={64}
            strokeWidth={7}
            label={`${Math.round((adminKPIs.seasonRevenue / adminKPIs.seasonGoal) * 100)}%`}
          />
          <div>
            <p className="text-xs text-muted">Season revenue</p>
            <p className="font-display text-lg font-bold text-ink tabular-nums">{formatCompactINR(adminKPIs.seasonRevenue)}</p>
            <p className="text-xs text-muted tabular-nums">of {formatCompactINR(adminKPIs.seasonGoal)} goal</p>
          </div>
        </Card>
        <KpiCard label="Net after payouts" value={formatCompactINR(adminKPIs.netAfterPayouts)} />
        <KpiCard label="Active students" value={String(adminKPIs.activeStudents)} />
        <KpiCard label="Sessions this week" value={String(adminKPIs.sessionsThisWeek)} />
        <KpiCard label="Unassigned" value={String(adminKPIs.unassignedSessions)} tone="danger" />
        <KpiCard label="Payouts due" value={String(adminKPIs.payoutsDue)} tone="warning" />
      </div>

      {/* Needs attention */}
      <Card>
        <CardHeader title="Needs attention" />
        <div className="grid sm:grid-cols-2 gap-2.5">
          {NEEDS_ATTENTION.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-hairline p-3 hover:border-border-strong"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  item.tone === "danger" ? "bg-danger-bg text-danger" : item.tone === "warning" ? "bg-warning-bg text-warning" : "bg-info-bg text-info"
                }`}
              >
                <item.icon size={15} />
              </span>
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2.5">
        {QUICK_ACTIONS.map((qa) => (
          <ButtonLink key={qa.label} href={qa.href} variant="outline" size="sm">
            <Plus size={14} /> {qa.label}
          </ButtonLink>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue by product" />
          <BarChart data={revenueByProduct} valueFormatter={(v) => formatCompactINR(v)} />
        </Card>
        <Card>
          <CardHeader title="Sessions per week" />
          <LineChart data={sessionsPerWeek} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Conversion funnel" subtitle="Quick Guidance → Mock PI → Package" />
          <Funnel steps={conversionFunnel} />
        </Card>
        <Card>
          <CardHeader title="Mentor utilisation" subtitle="Hours booked vs opened, this week" />
          <div className="space-y-3">
            {[
              { name: "Ishaan Kapoor", pct: 78 },
              { name: "Meera Nair", pct: 64 },
              { name: "Kabir Malhotra", pct: 40 },
              { name: "Rohan Bhatia", pct: 55 },
            ].map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className="text-muted tabular-nums">{m.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-sunken overflow-hidden">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex items-center gap-3 bg-sunken/40">
        <Users2 size={18} className="text-brand shrink-0" />
        <p className="text-sm text-ink">
          <strong>{formatINR(adminKPIs.netAfterPayouts)}</strong> net margin so far this season after mentor payouts.
        </p>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warning" }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display text-lg font-bold tabular-nums mt-1 ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink"}`}>
        {value}
      </p>
      {tone && <Badge variant={tone} className="mt-1.5">Action needed</Badge>}
    </Card>
  );
}
