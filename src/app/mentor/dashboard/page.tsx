import { Star, Clock3 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/stepper";
import { StatusChip } from "@/components/ui/status-chip";
import { currentMentor, sessionsForCurrentMentor, bonusTiers } from "@/lib/data";
import { formatINR, formatDate } from "@/lib/format";

const STATS = [
  { label: "Mock PI", value: 22 },
  { label: "GD/GE", value: 8 },
  { label: "WAT", value: 4 },
];

const nextSession = sessionsForCurrentMentor.find((s) => s.status === "confirmed" || s.status === "requested");
const pendingFeedback = [
  { id: "pf1", student: "Ananya Iyer", type: "Mock PI", due: "6h" },
  { id: "pf2", student: "Vikram Suresh", type: "WAT", due: "18h" },
];

const bonus = bonusTiers[currentMentor.tier];
const nextTier = bonus.find((b) => b.mocks > currentMentor.mocksThisSeason) ?? bonus[bonus.length - 1];
const prevTierMocks = bonus[bonus.indexOf(nextTier) - 1]?.mocks ?? 0;
const bonusPct = ((currentMentor.mocksThisSeason - prevTierMocks) / (nextTier.mocks - prevTierMocks)) * 100;

export default function MentorDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Hi {currentMentor.name.split(" ")[0]},</h1>
        <p className="text-sm text-muted mt-0.5">Here&apos;s your season so far.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((s) => (
          <Card key={s.label} padding="sm" className="text-center">
            <p className="font-display text-2xl font-bold text-ink tabular-nums">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Earnings" subtitle="This season" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Accrued</p>
              <p className="font-display text-xl font-bold text-ink tabular-nums">{formatINR(currentMentor.earningsAccrued)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Paid lifetime</p>
              <p className="font-display text-xl font-bold text-ink tabular-nums">{formatINR(currentMentor.earningsPaid)}</p>
            </div>
          </div>
          <ButtonLink href="/mentor/earnings" variant="outline" size="sm" className="mt-4">
            View earnings
          </ButtonLink>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Average rating</p>
          <div className="flex items-center gap-1.5">
            <Star size={22} className="fill-accent text-accent" />
            <span className="font-display text-3xl font-bold text-ink tabular-nums">{currentMentor.rating}</span>
          </div>
          <p className="text-xs text-muted mt-1">from {currentMentor.mocksThisSeason} sessions</p>
        </Card>
      </div>

      {nextSession && (
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next session</p>
            <p className="font-semibold text-ink mt-1">
              {nextSession.type} {nextSession.focus && `· ${nextSession.focus}`} with {nextSession.studentName}
            </p>
            <p className="text-sm text-muted mt-0.5">
              {formatDate(nextSession.date, { weekday: "short", month: "short" })} ·{" "}
              {nextSession.startTime}–{nextSession.endTime} IST
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip status={nextSession.status} />
            <Button>Start</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Pending feedback" subtitle="Submit within 24 hours of the session" />
        <div className="space-y-2.5">
          {pendingFeedback.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <div>
                <p className="text-sm font-medium text-ink">{f.type} · {f.student}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                  <Clock3 size={13} /> due in {f.due}
                </span>
                <Button size="sm" variant="outline">
                  Write feedback
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Bonus progress"
          subtitle={`${nextTier.mocks - currentMentor.mocksThisSeason} more mocks to unlock ${formatINR(nextTier.bonus)}`}
          action={<Badge variant="gold">{currentMentor.tier}</Badge>}
        />
        <ProgressBar value={bonusPct} />
        <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
          <span>{currentMentor.mocksThisSeason} mocks</span>
          <span>{nextTier.mocks} mocks</span>
        </div>
      </Card>
    </div>
  );
}
