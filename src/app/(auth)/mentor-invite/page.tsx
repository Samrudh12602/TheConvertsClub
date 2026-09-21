"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { SlotChip } from "@/components/ui/slot-chip";
import { ISTChip } from "@/components/ui/date-strip";

const STEPS = ["Profile", "Agreement", "Availability", "Done"];
const DAYS = ["Mon 5 Jan", "Tue 6 Jan", "Wed 7 Jan", "Thu 8 Jan", "Fri 9 Jan"];
const SLOTS = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

export default function MentorInvitePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSlot = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="w-full max-w-lg">
      <Card padding="lg">
        <p className="text-xs font-semibold text-accent-strong uppercase tracking-wide text-center">Mentor invite</p>
        <h1 className="font-display text-2xl font-semibold text-ink text-center mt-1">Welcome to The Convert Club</h1>
        <div className="mt-6">
          <Stepper steps={STEPS} current={step} />
        </div>

        <div className="mt-8">
          {step === 0 && (
            <div className="space-y-4">
              <Input label="Full name" defaultValue="Riya Chatterjee" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="College" defaultValue="IIM Lucknow" required />
                <Input label="Batch year" defaultValue="2025" required />
              </div>
              <Input label="Meeting link (Google Meet / Zoom)" placeholder="meet.google.com/xxx-yyyy-zzz" required />
              <Textarea label="Short bio" placeholder="One or two lines students will see on your profile." required />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4 text-sm text-muted leading-relaxed max-h-56 overflow-y-auto">
                <p className="font-semibold text-ink mb-2">Mentor agreement — summary</p>
                <p>By accepting, you agree to: conduct sessions professionally and on time, give honest and constructive feedback within 24 hours, keep student information confidential, and honour your stated availability. Payment follows the rate card configured by Admin for your tier, paid out monthly.</p>
              </div>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--gold-500)]" />
                I have read and agree to the mentor agreement.
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Confirm your weekly availability</p>
                <ISTChip />
              </div>
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-muted mb-1.5">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {SLOTS.map((slot) => {
                        const key = `${day}-${slot}`;
                        return (
                          <SlotChip
                            key={key}
                            label={slot}
                            state={selected.has(key) ? "selected" : "open"}
                            onClick={() => toggleSlot(key)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted">{selected.size} hours opened this week. You can add more anytime from Availability.</p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-display mt-4 text-xl font-semibold text-ink">You&apos;re onboarded</h2>
              <p className="mt-1.5 text-sm text-muted">Your mentor account is ready. Head to your dashboard to see your first assignments.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 && step < 3 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 2 && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !agreed}>
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => setStep(3)} disabled={selected.size === 0}>
              Confirm availability
            </Button>
          )}
          {step === 3 && (
            <Button fullWidth onClick={() => router.push("/mentor/dashboard" as never)}>
              Go to dashboard
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
