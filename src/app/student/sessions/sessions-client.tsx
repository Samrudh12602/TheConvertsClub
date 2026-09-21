"use client";

import { useState } from "react";
import { Download, Star, Video, FileWarning, CalendarX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { StatusChip, SessionStatus } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/states";
import { RadarChart } from "@/components/ui/radar-chart";
import { sessionsForCurrentStudent, type Session } from "@/lib/data";
import { formatDate } from "@/lib/format";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const UPCOMING: SessionStatus[] = ["requested", "confirmed", "rescheduled"];
const PAST: SessionStatus[] = ["completed", "feedback-pending", "no-show"];
const CANCELLED: SessionStatus[] = ["cancelled"];

export function SessionsClient() {
  const [tab, setTab] = useState("upcoming");
  const [selected, setSelected] = useState<Session | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rating, setRating] = useState(0);

  const list = sessionsForCurrentStudent.filter((s) =>
    tab === "upcoming" ? UPCOMING.includes(s.status) : tab === "past" ? PAST.includes(s.status) : CANCELLED.includes(s.status)
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">My sessions</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState icon={CalendarX} title={`No ${tab} sessions`} description="Sessions you book will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:border-border-strong" onClick={() => setSelected(s)} as="button">
              <div className="flex items-start justify-between">
                <div className="text-left">
                  <p className="font-semibold text-ink">
                    {s.type} {s.focus && `· ${s.focus}`}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {formatDate(s.date, { weekday: "short", month: "short" })} · {s.startTime}
                    {s.endTime !== "—" && `–${s.endTime}`} IST
                  </p>
                  <p className="text-xs text-muted mt-1">with {s.mentorName}</p>
                </div>
                <StatusChip status={s.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.type} subtitle={selected ? `with ${selected.mentorName}` : undefined}>
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusChip status={selected.status} />
              <span className="text-sm text-muted">
                {formatDate(selected.date, { weekday: "long", month: "long" })} · {selected.startTime}
                {selected.endTime !== "—" && `–${selected.endTime}`} IST
              </span>
            </div>

            {selected.meetingLink && (
              <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-3.5">
                <Video size={16} className="text-brand shrink-0" />
                <span className="text-sm text-ink truncate">{selected.meetingLink}</span>
              </div>
            )}

            {selected.note && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Your note to the mentor</p>
                <p className="text-sm text-ink">{selected.note}</p>
              </div>
            )}

            {UPCOMING.includes(selected.status) && (
              <div className="flex gap-3">
                <Button variant="outline" fullWidth>
                  Reschedule
                </Button>
                <Button variant="danger" fullWidth onClick={() => setConfirmCancel(true)}>
                  Cancel
                </Button>
              </div>
            )}

            {selected.status === "no-show" && (
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-bg p-4">
                <FileWarning size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-ink">Marked as a no-show. Your credit has been restored — rebook anytime.</p>
              </div>
            )}

            {selected.status === "feedback-pending" && (
              <div className="rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4 text-sm text-muted">
                Feedback is being prepared by your mentor. You&apos;ll be notified when it&apos;s ready.
              </div>
            )}

            {selected.feedback && (
              <div className="space-y-5 pt-2 border-t border-hairline">
                <div className="flex items-center justify-between pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Feedback report</p>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                    <Download size={13} /> Download PDF
                  </button>
                </div>

                <div className="flex justify-center">
                  <RadarChart
                    axes={["Comm.", "Content", "Profile", "Cross-Q", "Confidence", "Fit"]}
                    values={[
                      selected.feedback.rubric.communication,
                      selected.feedback.rubric.content,
                      selected.feedback.rubric.profileKnowledge,
                      selected.feedback.rubric.crossQuestioning,
                      selected.feedback.rubric.confidence,
                      selected.feedback.rubric.instituteFit,
                    ]}
                    size={220}
                  />
                </div>

                <FeedbackBlock label="Strengths" text={selected.feedback.strengths} tone="success" />
                <FeedbackBlock label="Weaknesses" text={selected.feedback.weaknesses} tone="warning" />
                <FeedbackBlock label="Red flags" text={selected.feedback.redFlags} tone="danger" />
                <FeedbackBlock label="Answer-framing suggestions" text={selected.feedback.answerFraming} tone="info" />
                <FeedbackBlock label="Questions to prepare next" text={selected.feedback.questionsToPrepare} tone="neutral" />

                <div className="pt-4 border-t border-hairline">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Rate this session</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)}>
                        <Star size={22} className={n <= rating ? "fill-accent text-accent" : "text-border-strong"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => setConfirmCancel(false)}
        title="Cancel this session?"
        description="Cancelling within 4 hours of your slot uses one session credit. This can't be undone."
        confirmLabel="Cancel session"
        destructive
      />
    </div>
  );
}

function FeedbackBlock({ label, text, tone }: { label: string; text: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const colors = {
    success: "border-success/25 bg-success-bg",
    warning: "border-warning/25 bg-warning-bg",
    danger: "border-danger/25 bg-danger-bg",
    info: "border-info/25 bg-info-bg",
    neutral: "border-hairline bg-sunken/40",
  };
  return (
    <div className={`rounded-[var(--radius-md)] border p-3.5 ${colors[tone]}`}>
      <p className="text-xs font-semibold text-ink mb-1">{label}</p>
      <p className="text-sm text-ink/90">{text}</p>
    </div>
  );
}
