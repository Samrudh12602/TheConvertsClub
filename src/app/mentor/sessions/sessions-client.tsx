"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, FileText, GraduationCap, Target, CalendarX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/states";
import { sessionsForCurrentMentor, students, type Session } from "@/lib/data";
import { formatDate } from "@/lib/format";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export function MentorSessionsClient() {
  const router = useRouter();
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<Session | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<Session | null>(null);

  const list = sessionsForCurrentMentor.filter((s) =>
    tab === "pending" ? s.status === "requested" : tab === "upcoming" ? s.status === "confirmed" : ["completed", "feedback-pending", "no-show"].includes(s.status)
  );

  const brief = selected ? students.find((s) => s.name === selected.studentName) : null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Sessions</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState icon={CalendarX} title={`No ${tab} sessions`} description="New assignments will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((s) => (
            <Card key={s.id} as="button" className="text-left cursor-pointer hover:border-border-strong" onClick={() => setSelected(s)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">
                    {s.type} {s.focus && `· ${s.focus}`}
                  </p>
                  <p className="text-sm text-muted mt-1">with {s.studentName}</p>
                  <p className="text-xs text-muted mt-1">
                    {formatDate(s.date, { weekday: "short", month: "short" })} · {s.startTime}
                    {s.endTime !== "—" && `–${s.endTime}`} IST
                  </p>
                </div>
                <StatusChip status={s.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.type} subtitle={selected ? `with ${selected.studentName}` : undefined}>
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusChip status={selected.status} />
              <span className="text-sm text-muted">
                {formatDate(selected.date, { weekday: "long", month: "long" })} · {selected.startTime}
                {selected.endTime !== "—" && `–${selected.endTime}`} IST
              </span>
            </div>

            {brief && (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Student brief</p>
                <div className="flex items-start gap-2.5 text-sm text-ink">
                  <GraduationCap size={15} className="text-brand shrink-0 mt-0.5" /> {brief.college} · {brief.degree}
                </div>
                <div className="flex items-start gap-2.5 text-sm text-ink">
                  <Target size={15} className="text-brand shrink-0 mt-0.5" /> Targets: {brief.calls.map((c) => c.institute).join(", ")}
                </div>
                {brief.weakAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {brief.weakAreas.map((w) => (
                      <span key={w} className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-medium text-warning">
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                <button className="flex items-center gap-1.5 text-xs font-semibold text-brand pt-1">
                  <FileText size={13} /> View resume & documents
                </button>
              </div>
            )}

            {selected.note && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">Student&apos;s note</p>
                <p className="text-sm text-ink">{selected.note}</p>
              </div>
            )}

            {selected.meetingLink && (
              <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-hairline p-3.5">
                <Video size={16} className="text-brand shrink-0" />
                <span className="text-sm text-ink truncate">{selected.meetingLink}</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {tab === "pending" && (
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={() => setSelected(null)}>
                    Decline
                  </Button>
                  <Button fullWidth onClick={() => setSelected(null)}>
                    Accept
                  </Button>
                </div>
              )}
              {tab === "upcoming" && (
                <>
                  <Button fullWidth>Start session</Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        router.push(`/mentor/feedback/${selected.id}` as never);
                      }}
                    >
                      Mark completed
                    </Button>
                    <Button variant="danger" fullWidth onClick={() => setNoShowTarget(selected)}>
                      Report no-show
                    </Button>
                  </div>
                </>
              )}
              {tab === "completed" && selected.status === "feedback-pending" && (
                <Button fullWidth onClick={() => router.push(`/mentor/feedback/${selected.id}` as never)}>
                  Write feedback
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={() => {
          setNoShowTarget(null);
          setSelected(null);
        }}
        title="Report as no-show?"
        description="The student's credit will be restored automatically and Admin will be notified."
        confirmLabel="Report no-show"
        destructive
      />
    </div>
  );
}
