import { Flame, CircleCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts";
import { StatusChip } from "@/components/ui/status-chip";
import { currentStudent, sessionsForCurrentStudent } from "@/lib/data";
import { formatDate } from "@/lib/format";

const SCORE_TREND = [
  { label: "S1", value: 2.6 },
  { label: "S2", value: 3.0 },
  { label: "S3", value: 3.2 },
  { label: "S4", value: 3.5 },
  { label: "S5", value: 3.6 },
];

const AREAS = ["Communication", "Content", "Profile knowledge", "Cross-questioning", "Confidence", "Institute fit"] as const;
const HEATMAP_KEYS: Record<(typeof AREAS)[number], keyof typeof currentStudent.readiness> = {
  Communication: "communication",
  Content: "content",
  "Profile knowledge": "profileKnowledge",
  "Cross-questioning": "crossQuestioning",
  Confidence: "confidence",
  "Institute fit": "instituteFit",
};

function heatColor(score: number) {
  if (score >= 4) return "bg-success text-white";
  if (score >= 3) return "bg-gold-400 text-navy-950";
  if (score >= 2) return "bg-warning text-white";
  return "bg-danger text-white";
}

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Progress</h1>
        <div className="flex items-center gap-2 rounded-full bg-warning-bg px-3.5 py-1.5 text-sm font-semibold text-warning">
          <Flame size={16} /> 4-session streak
        </div>
      </div>

      <Card>
        <CardHeader title="Readiness score trend" subtitle="Average rubric score across your last 5 sessions" />
        <LineChart data={SCORE_TREND} />
      </Card>

      <Card>
        <CardHeader title="Weak-area heatmap" subtitle="Darker means stronger. Based on mentor rubric scores." />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {AREAS.map((area) => {
            const score = currentStudent.readiness[HEATMAP_KEYS[area]];
            return (
              <div key={area} className={`flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] py-4 px-2 text-center ${heatColor(score)}`}>
                <span className="font-display text-xl font-bold tabular-nums">{score}</span>
                <span className="text-[10px] font-semibold leading-tight">{area}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Session timeline" />
        <div className="space-y-4">
          {sessionsForCurrentStudent.map((s) => (
            <div key={s.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1">
                <span className="flex h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="w-px flex-1 bg-hairline mt-1" />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {s.type} {s.focus && `· ${s.focus}`}
                  </p>
                  <StatusChip status={s.status} />
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {formatDate(s.date, { month: "short" })} · {s.mentorName}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted pl-6">
            <CircleCheck size={14} /> Start of your journey
          </div>
        </div>
      </Card>
    </div>
  );
}
