"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, CalendarDays, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { DateStrip, ISTChip, DateOption } from "@/components/ui/date-strip";
import { SlotChip, SlotState } from "@/components/ui/slot-chip";
import { Badge } from "@/components/ui/badge";
import { currentStudent } from "@/lib/data";
import { formatINR, formatDate } from "@/lib/format";

type SessionKind = "Mock PI" | "Strategy Call" | "Mock GD/GE";

const SESSION_TYPES: { kind: SessionKind; description: string; used: number; total: number }[] = [
  { kind: "Mock PI", description: "One-on-one personalised interview practice.", used: currentStudent.credits.pi.used, total: currentStudent.credits.pi.total },
  { kind: "Strategy Call", description: "Plan which mocks to prioritise for your timeline.", used: currentStudent.credits.strategyCalls.used, total: currentStudent.credits.strategyCalls.total },
  { kind: "Mock GD/GE", description: "Group discussion or group exercise with peers.", used: currentStudent.credits.gdge.used, total: currentStudent.credits.gdge.total },
];

const FOCUS_OPTIONS = ["HR + Profile", "Academics", "Stress / Cross-questioning", "Institute-specific final"];

const STEPS = ["Type", "Date", "Slot", "Confirm"];

function buildDateOptions(): DateOption[] {
  const options: DateOption[] = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push({ date: d, hasAvailability: ![2, 5].includes(i) });
  }
  return options;
}

const SLOT_GROUPS: { label: string; slots: string[] }[] = [
  { label: "Morning", slots: ["9:00 AM", "10:00 AM", "11:00 AM"] },
  { label: "Afternoon", slots: ["1:00 PM", "2:00 PM", "3:00 PM"] },
  { label: "Evening", slots: ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"] },
];

const SLOT_OVERRIDES: Record<string, SlotState> = { "2:00 PM": "booked", "6:00 PM": "held", "7:00 PM": "just-taken" };

export function BookClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<SessionKind | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [dateOptions] = useState(buildDateOptions);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"confirmed" | "requested" | null>(null);

  const selectedType = SESSION_TYPES.find((t) => t.kind === kind);
  const hasCredits = selectedType ? selectedType.used < selectedType.total : true;

  const canContinue = useMemo(() => {
    if (step === 0) return !!kind && (kind !== "Mock PI" || !!focus);
    if (step === 1) return !!selectedDate;
    if (step === 2) return !!selectedSlot;
    return true;
  }, [step, kind, focus, selectedDate, selectedSlot]);

  const confirmBooking = () => {
    // Mentors with an instant-confirm setting auto-confirm; others go to request.
    setOutcome(kind === "Strategy Call" ? "confirmed" : "requested");
    setStep(4);
  };

  if (step === 4 && outcome) {
    return (
      <div className="mx-auto max-w-md text-center py-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">
          {outcome === "confirmed" ? "Session confirmed" : "Request sent"}
        </h1>
        <p className="mt-2 text-muted">
          {outcome === "confirmed"
            ? `Your ${kind} is booked for ${selectedDate ? formatDate(selectedDate, { weekday: "long", month: "long" }) : ""}, ${selectedSlot} IST.`
            : `We've sent your request to a mentor. You'll get their details once confirmed — usually within a few hours.`}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button variant="outline" onClick={() => {}}>
            Add to Google Calendar / .ics
          </Button>
          <Button onClick={() => router.push("/student/sessions" as never)}>Go to My Sessions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Book a session</h1>
      <Stepper steps={STEPS} current={step} />

      <Card padding="lg" className="mt-8">
        {step === 0 && (
          <div className="space-y-3">
            {SESSION_TYPES.map((t) => {
              const remaining = t.total - t.used;
              const disabled = remaining <= 0;
              return (
                <button
                  key={t.kind}
                  onClick={() => setKind(t.kind)}
                  className={`flex w-full items-start justify-between gap-4 rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                    kind === t.kind ? "border-brand bg-sunken/60" : "border-hairline hover:border-border-strong"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">{t.kind}</p>
                    <p className="text-sm text-muted mt-0.5">{t.description}</p>
                  </div>
                  <Badge variant={disabled ? "danger" : "neutral"} className="shrink-0">
                    {remaining} of {t.total} left
                  </Badge>
                </button>
              );
            })}

            {kind === "Mock PI" && (
              <div className="pt-2">
                <p className="text-sm font-medium text-ink mb-2">Choose a focus area</p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFocus(f)}
                      className={`rounded-full border px-3.5 py-2 text-sm font-medium ${
                        focus === f ? "border-accent bg-accent text-on-gold" : "border-border-strong text-ink hover:bg-sunken"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind && !hasCredits && (
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning-bg p-4">
                <ShieldAlert size={18} className="text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">No credits remaining for {kind}</p>
                  <p className="text-xs text-muted mt-0.5">Add one for {formatINR(449)} to continue, or use a different credit.</p>
                  <Button size="sm" className="mt-3">
                    Add a PI for {formatINR(449)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                <CalendarDays size={16} /> Pick a date
              </p>
              <ISTChip />
            </div>
            <DateStrip options={dateOptions} selected={selectedDate} onSelect={setSelectedDate} />
            <p className="text-xs text-muted mt-3">Muted dates have no mentor availability for {kind}.</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                <Clock3 size={16} /> Pick a 1-hour slot
              </p>
              <ISTChip />
            </div>
            <div className="space-y-5">
              {SLOT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => {
                      const overridden = SLOT_OVERRIDES[slot];
                      const state: SlotState = selectedSlot === slot ? "selected" : overridden ?? "open";
                      return (
                        <SlotChip
                          key={slot}
                          label={slot}
                          state={state}
                          onClick={() => setSelectedSlot(slot)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Summary</p>
              <p className="font-semibold text-ink">
                {kind} {focus && `· ${focus}`}
              </p>
              <p className="text-sm text-muted mt-1">
                {selectedDate && formatDate(selectedDate, { weekday: "long", month: "long" })} · {selectedSlot} IST
              </p>
            </div>
            <Textarea
              label="Note to the mentor (optional)"
              placeholder='e.g. "Preparing for XLRI final, weak on Why MBA"'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted">
              Cancellation policy: reschedule free up to 4 hours before your slot. Late cancellations use one session credit.
            </p>
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button onClick={confirmBooking}>Confirm booking</Button>
        )}
      </div>
    </div>
  );
}
