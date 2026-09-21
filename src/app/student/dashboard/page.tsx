import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { MiniCreditRing, ProgressRing } from "@/components/ui/progress-ring";
import { RadarChart } from "@/components/ui/radar-chart";
import { ISTChip } from "@/components/ui/date-strip";
import { StatusChip } from "@/components/ui/status-chip";
import { currentStudent, sessionsForCurrentStudent } from "@/lib/data";
import { formatINR, formatDate } from "@/lib/format";

const nextRealInterview = { institute: "XLRI Jamshedpur", date: "2026-10-05" };
const daysToInterview = Math.max(
  0,
  Math.ceil((new Date(nextRealInterview.date).getTime() - Date.now()) / 86400000)
);

const nextSession = sessionsForCurrentStudent.find((s) => s.status === "confirmed" || s.status === "requested");
const readiness = currentStudent.readiness;
const readinessAvg = (
  (readiness.communication + readiness.content + readiness.profileKnowledge + readiness.crossQuestioning + readiness.confidence + readiness.instituteFit) /
  6
).toFixed(1);

const checklist = [
  { label: "Complete your onboarding profile", done: true },
  { label: "Book your first Mock PI", done: true },
  { label: "Submit a WAT for evaluation", done: currentStudent.credits.wat.used > 0 },
  { label: "Review feedback from your last session", done: false },
  { label: "Read your personalised PI booklet", done: false },
];

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Hi {currentStudent.name.split(" ")[0]},</h1>
          <p className="text-sm text-muted mt-0.5">
            <strong className="text-ink tabular-nums">{daysToInterview} days</strong> to your {nextRealInterview.institute} interview.
          </p>
        </div>
        <ISTChip />
      </div>

      {/* Next session */}
      {nextSession ? (
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next session</p>
            <p className="font-semibold text-ink mt-1">
              {nextSession.type} {nextSession.focus && `· ${nextSession.focus}`}
            </p>
            <p className="text-sm text-muted mt-0.5">
              {formatDate(nextSession.date, { weekday: "short", month: "short" })} ·{" "}
              {nextSession.startTime}–{nextSession.endTime} IST with {nextSession.mentorName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip status={nextSession.status} />
            <Button disabled title="Join opens 10 minutes before start">
              Join
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted">No upcoming sessions. Book your next Mock PI to keep your momentum.</p>
          <ButtonLink href="/student/book" className="mt-3" size="sm">
            Book a session
          </ButtonLink>
        </Card>
      )}

      {/* Credits + readiness */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Your credits" subtitle="Included in your Call Convert package" />
          <div className="flex flex-wrap gap-5 justify-between sm:justify-start sm:gap-8">
            <MiniCreditRing used={currentStudent.credits.pi.used} total={currentStudent.credits.pi.total} label="Mock PI" />
            <MiniCreditRing used={currentStudent.credits.gdge.used} total={currentStudent.credits.gdge.total} label="GD/GE" />
            <MiniCreditRing used={currentStudent.credits.wat.used} total={currentStudent.credits.wat.total} label="WAT" />
            <MiniCreditRing used={currentStudent.credits.strategyCalls.used} total={currentStudent.credits.strategyCalls.total} label="Strategy call" />
            <MiniCreditRing used={currentStudent.credits.sop.used} total={currentStudent.credits.sop.total} label="SOP" />
          </div>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <CardHeader title="Readiness score" className="self-start text-left" />
          <ProgressRing value={Number(readinessAvg)} max={5} size={96} label={readinessAvg} sublabel="out of 5" />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex flex-col items-center">
          <CardHeader title="Readiness breakdown" className="self-start" />
          <RadarChart
            axes={["Comm.", "Content", "Profile", "Cross-Q", "Confidence", "Fit"]}
            values={[readiness.communication, readiness.content, readiness.profileKnowledge, readiness.crossQuestioning, readiness.confidence, readiness.instituteFit]}
          />
        </Card>

        <Card>
          <CardHeader title="What to do next" />
          <ul className="space-y-2.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done ? "border-success bg-success-bg text-success" : "border-border-strong text-transparent"
                  }`}
                >
                  {item.done && <Check size={12} />}
                </span>
                <span className={item.done ? "text-muted line-through" : "text-ink"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Latest feedback highlights" action={<Link href="/student/sessions" className="text-xs font-semibold text-brand">View all</Link>} />
          <p className="text-sm text-ink font-medium">Mock PI with Ishaan Kapoor · 15 Sep</p>
          <p className="text-sm text-muted mt-1">
            &ldquo;Clear structure on Why MBA. Loses composure under rapid cross-questioning — practice the same point from three angles.&rdquo;
          </p>
        </Card>

        <Card className="bg-navy-950 border-navy-950">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">One more Mock PI before XLRI?</p>
              <p className="text-sm text-navy-100 mt-1">You&apos;ve used 2 of 4 credits. Add an extra session for {formatINR(449)}.</p>
              <ButtonLink href="/student/book" size="sm" className="mt-3">
                Add a PI <ArrowRight size={14} />
              </ButtonLink>
            </div>
          </div>
        </Card>
      </div>

      <Card className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-bg text-success">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">Need help fast?</p>
            <p className="text-xs text-muted">WhatsApp support · 10 AM–9 PM IST, all days</p>
          </div>
        </div>
        <Badge variant="success">Reasonable-use</Badge>
      </Card>
    </div>
  );
}
