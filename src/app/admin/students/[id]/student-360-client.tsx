"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, PlusCircle, CalendarPlus, RotateCcw, Ban, Eye, UserCog } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { StatusChip } from "@/components/ui/status-chip";
import { ConfirmDialog } from "@/components/ui/modal";
import { MiniCreditRing } from "@/components/ui/progress-ring";
import { RadarChart } from "@/components/ui/radar-chart";
import { students, sessions } from "@/lib/data";
import { formatINR, formatDate } from "@/lib/format";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "sessions", label: "Sessions" },
  { key: "feedback", label: "Feedback & progress" },
  { key: "documents", label: "Documents" },
  { key: "payments", label: "Payments" },
  { key: "calls", label: "Calls tracker" },
  { key: "notes", label: "Internal notes" },
  { key: "activity", label: "Activity log" },
];

export function Student360Client() {
  const params = useParams<{ id: string }>();
  const student = students.find((s) => s.id === params.id) ?? students[0];
  const [tab, setTab] = useState("overview");
  const [suspendOpen, setSuspendOpen] = useState(false);

  const studentSessions = sessions.filter((s) => s.studentId === student.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">{student.name}</h1>
            <p className="text-sm text-muted">
              {student.email} · {student.college}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <MessageSquare size={14} /> Message
          </Button>
          <Button size="sm" variant="outline">
            <PlusCircle size={14} /> Add / remove credits
          </Button>
          <Button size="sm" variant="outline">
            <CalendarPlus size={14} /> Extend
          </Button>
          <Button size="sm" variant="outline">
            <RotateCcw size={14} /> Refund
          </Button>
          <Button size="sm" variant="danger" onClick={() => setSuspendOpen(true)}>
            <Ban size={14} /> Suspend
          </Button>
          <Link
            href={`/student/dashboard?admin_view=student&name=${encodeURIComponent(student.name)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-border-strong px-3.5 text-sm font-semibold text-ink hover:bg-sunken"
          >
            <Eye size={14} /> View as student
          </Link>
        </div>
      </div>

      <Card className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <UserCog size={18} className="text-muted" />
          <div>
            <p className="text-xs text-muted">Assigned mentor</p>
            <p className="text-sm font-semibold text-ink">{student.assignedMentor}</p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          Reassign mentor
        </Button>
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Credits" />
            <div className="flex flex-wrap gap-6">
              <MiniCreditRing used={student.credits.pi.used} total={student.credits.pi.total} label="Mock PI" />
              <MiniCreditRing used={student.credits.gdge.used} total={student.credits.gdge.total} label="GD/GE" />
              <MiniCreditRing used={student.credits.wat.used} total={student.credits.wat.total} label="WAT" />
              <MiniCreditRing used={student.credits.sop.used} total={student.credits.sop.total} label="SOP" />
            </div>
          </Card>
          <Card className="flex flex-col items-center">
            <CardHeader title="Readiness" className="self-start" />
            <RadarChart
              axes={["Comm.", "Content", "Profile", "Cross-Q", "Confidence", "Fit"]}
              values={[
                student.readiness.communication,
                student.readiness.content,
                student.readiness.profileKnowledge,
                student.readiness.crossQuestioning,
                student.readiness.confidence,
                student.readiness.instituteFit,
              ]}
              size={220}
            />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Profile" />
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted">Degree</p>
                <p className="text-ink font-medium">{student.degree}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Work experience</p>
                <p className="text-ink font-medium">{student.workEx}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Phone</p>
                <p className="text-ink font-medium">{student.phone}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "sessions" && (
        <Card padding="none">
          <div className="divide-y divide-hairline">
            {studentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {s.type} {s.focus && `· ${s.focus}`}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDate(s.date, { month: "short" })} · {s.mentorName}
                  </p>
                </div>
                <StatusChip status={s.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "feedback" && (
        <div className="space-y-4">
          {studentSessions
            .filter((s) => s.feedback)
            .map((s) => (
              <Card key={s.id}>
                <p className="text-sm font-semibold text-ink">
                  {s.type} · {formatDate(s.date, { month: "short" })}
                </p>
                <p className="text-sm text-muted mt-2">{s.feedback?.strengths}</p>
                <p className="text-sm text-muted mt-1">{s.feedback?.weaknesses}</p>
                <Badge variant="info" className="mt-3">
                  {s.feedback?.recommendation}
                </Badge>
              </Card>
            ))}
        </div>
      )}

      {tab === "documents" && (
        <Card>
          <div className="space-y-2.5">
            {["Resume.pdf", "SOP_Draft.pdf"].map((doc) => (
              <div key={doc} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5 text-sm">
                <span className="text-ink">{doc}</span>
                <button className="text-brand font-semibold">Download</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "payments" && (
        <Card>
          <CardHeader title="Payments & credits ledger" />
          <div className="flex items-center justify-between text-sm py-2 border-b border-hairline">
            <span className="text-ink">Package purchased — {student.package}</span>
            <span className="font-semibold text-ink tabular-nums">{formatINR(2199)}</span>
          </div>
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-ink">Additional PI</span>
            <span className="font-semibold text-ink tabular-nums">{formatINR(449)}</span>
          </div>
        </Card>
      )}

      {tab === "calls" && (
        <div className="space-y-3">
          {student.calls.map((c) => (
            <Card key={c.institute} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{c.institute}</p>
                <p className="text-xs text-muted">{formatDate(c.interviewDate, { month: "short" })}</p>
              </div>
              <Badge variant={c.stage === "Converted" ? "success" : c.stage === "Not converted" ? "danger" : "neutral"}>{c.stage}</Badge>
            </Card>
          ))}
        </div>
      )}

      {tab === "notes" && (
        <Card>
          <CardHeader title="Internal notes" subtitle="Visible only to Admin" />
          <textarea
            className="w-full min-h-32 rounded-[var(--radius-sm)] border border-hairline bg-surface p-3 text-sm text-ink"
            placeholder="Add a note about this student…"
            defaultValue="Strong profile, needs cross-questioning practice before XLRI final. Recommend 1 more Mock PI with Ishaan before 5 Oct."
          />
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          <div className="space-y-3 text-sm">
            {["Booked Mock PI with Ishaan Kapoor — 20 Sep", "Purchased Call Convert package — 5 Jan", "Account created — 5 Jan"].map((a) => (
              <div key={a} className="flex items-center gap-3 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" /> {a}
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => setSuspendOpen(false)}
        title={`Suspend ${student.name}?`}
        description="They'll lose access to booking and their portal immediately. This can be reversed anytime."
        confirmLabel="Suspend account"
        destructive
      />
    </div>
  );
}
