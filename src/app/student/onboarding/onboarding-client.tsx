"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stepper, ProgressBar } from "@/components/ui/stepper";

const STEPS = ["About you", "Your calls", "Documents", "Preferences"];
const WEAK_AREAS = ["Communication", "Content", "Profile knowledge", "Cross-questioning", "Confidence", "Institute fit"];

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [calls, setCalls] = useState([{ institute: "", date: "", stage: "GD" }]);
  const [weakAreas, setWeakAreas] = useState<Set<string>>(new Set());
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [sopUploaded, setSopUploaded] = useState(false);
  const [done, setDone] = useState(false);

  const toggleWeak = (area: string) => {
    setWeakAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const addCall = () => setCalls((c) => [...c, { institute: "", date: "", stage: "GD" }]);

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">Profile complete</h1>
        <p className="mt-2 text-muted">Your mentor match and personalised checklist are ready on your dashboard.</p>
        <Button size="lg" className="mt-8" onClick={() => router.push("/student/dashboard" as never)}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl font-semibold text-ink">Tell us about you</h1>
        <button onClick={() => router.push("/student/dashboard" as never)} className="text-xs font-semibold text-muted hover:text-ink">
          Save and continue later
        </button>
      </div>
      <ProgressBar value={((step + 1) / STEPS.length) * 100} className="mb-6" />
      <Stepper steps={STEPS} current={step} />

      <Card padding="lg" className="mt-8">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="College" placeholder="e.g. NIT Trichy" required />
              <Input label="Degree" placeholder="e.g. B.Tech Mechanical" required />
            </div>
            <Select label="Work experience" defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>Fresher</option>
              <option>0–1 years</option>
              <option>1–3 years</option>
              <option>3+ years</option>
            </Select>
            <Input label="What do you do / did you do?" placeholder="e.g. Product analytics at a fintech startup" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Add every B-school call you&apos;ve received so far.</p>
            {calls.map((call, i) => (
              <div key={i} className="grid sm:grid-cols-3 gap-3 rounded-[var(--radius-md)] border border-hairline p-3.5">
                <Input placeholder="Institute" defaultValue={call.institute} />
                <Input type="date" placeholder="Interview date" defaultValue={call.date} />
                <Select defaultValue={call.stage}>
                  <option value="GD">GD stage</option>
                  <option value="PI">PI stage</option>
                  <option value="WAT">WAT stage</option>
                  <option value="Result">Awaiting result</option>
                </Select>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCall}>
              + Add another call
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <UploadTile label="Resume" uploaded={resumeUploaded} onUpload={() => setResumeUploaded(true)} onRemove={() => setResumeUploaded(false)} />
            <UploadTile label="SOP (if you have one)" uploaded={sopUploaded} onUpload={() => setSopUploaded(true)} onRemove={() => setSopUploaded(false)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-ink mb-2">Where do you feel weakest? Pick all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {WEAK_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleWeak(area)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                      weakAreas.has(area) ? "border-accent bg-accent text-on-gold" : "border-border-strong text-ink hover:bg-sunken"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Availability windows" placeholder="e.g. Weekday evenings after 6 PM, weekends anytime" />
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
        <Button onClick={() => (step < STEPS.length - 1 ? setStep((s) => s + 1) : setDone(true))}>
          {step < STEPS.length - 1 ? "Continue" : "Finish"}
        </Button>
      </div>
    </div>
  );
}

function UploadTile({
  label,
  uploaded,
  onUpload,
  onRemove,
}: {
  label: string;
  uploaded: boolean;
  onUpload: () => void;
  onRemove: () => void;
}) {
  if (uploaded) {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline bg-sunken/40 px-4 py-3.5">
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <CheckCircle2 size={16} className="text-success" /> {label}.pdf uploaded
        </span>
        <button onClick={onRemove} className="text-muted hover:text-danger">
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onUpload}
      className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong px-4 py-8 text-sm text-muted hover:border-brand hover:text-brand"
    >
      <UploadCloud size={22} />
      Upload {label} (PDF)
    </button>
  );
}
