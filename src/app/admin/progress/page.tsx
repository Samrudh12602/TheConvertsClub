import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/ui/charts";

const READINESS_DIST = [
  { label: "1–2", value: 3 },
  { label: "2–3", value: 8 },
  { label: "3–4", value: 16 },
  { label: "4–5", value: 11 },
];

const RATES = [
  { label: "Session completion rate", value: "92%" },
  { label: "No-show rate", value: "4%" },
  { label: "Avg. mentor rating", value: "4.7 / 5" },
  { label: "Feedback turnaround", value: "14h avg" },
];

const OUTCOMES = [
  { label: "Converted", value: 12, tone: "success" as const },
  { label: "Waitlisted", value: 5, tone: "warning" as const },
  { label: "Awaiting", value: 18, tone: "neutral" as const },
  { label: "Not converted", value: 3, tone: "danger" as const },
];

const TESTIMONIAL_PIPELINE = [
  { student: "Aarav Mehta", institute: "SIBM Pune", status: "Opted in" },
  { student: "Vikram Suresh", institute: "NMIMS Mumbai", status: "Collected" },
  { student: "Sanya Kapoor", institute: "SPJIMR Mumbai", status: "Requested" },
];

export default function ProgressQualityPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Progress & quality</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {RATES.map((r) => (
          <Card key={r.label} padding="sm">
            <p className="text-xs text-muted">{r.label}</p>
            <p className="font-display text-lg font-bold text-ink tabular-nums mt-1">{r.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Cohort readiness distribution" subtitle="Number of students by average readiness score" />
        <BarChart data={READINESS_DIST} />
      </Card>

      <Card>
        <CardHeader title="Converted-call outcomes" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {OUTCOMES.map((o) => (
            <div key={o.label} className="rounded-[var(--radius-md)] border border-hairline p-4 text-center">
              <p className="font-display text-2xl font-bold text-ink tabular-nums">{o.value}</p>
              <Badge variant={o.tone} className="mt-2">
                {o.label}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Testimonial pipeline" />
        <div className="divide-y divide-hairline">
          {TESTIMONIAL_PIPELINE.map((t) => (
            <div key={t.student} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-sm">
              <div>
                <p className="text-ink font-medium">{t.student}</p>
                <p className="text-xs text-muted">{t.institute}</p>
              </div>
              <Badge variant={t.status === "Collected" ? "success" : t.status === "Opted in" ? "info" : "neutral"}>{t.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
