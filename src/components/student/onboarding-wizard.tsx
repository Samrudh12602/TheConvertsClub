"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { saveOnboardingAction } from "@/app/student/actions";

const INSTITUTES = ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "IIM Lucknow", "IIM Indore", "IIM Kozhikode", "XLRI", "FMS Delhi", "SPJIMR", "MDI Gurgaon"];
const WEAK = ["Stress handling", "Body language", "Current affairs", "Academics", "Work-ex answers", "Why MBA", "Structure", "Clarity"];

export interface OnboardingInitial { college: string; degree: string; workExMonths: string; phone: string; targetInstitutes: string[]; weakAreas: string[]; step: number }

export function OnboardingWizard({ initial }: { initial: OnboardingInitial }) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initial.step, 0), 3) + 1); // 1..4
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toggle = (k: "targetInstitutes" | "weakAreas", v: string) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  async function next() {
    setBusy(true); setErr(null);
    const r = await saveOnboardingAction(step === 4 ? 4 : step, { college: d.college, degree: d.degree, workExMonths: d.workExMonths === "" ? undefined : d.workExMonths, phone: d.phone, targetInstitutes: d.targetInstitutes, weakAreas: d.weakAreas });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    if (step === 4) { router.push("/student"); router.refresh(); } else setStep(step + 1);
  }
  const chip = (on: boolean) => clsx("min-h-11 rounded-lg border px-[13px] text-[12.5px] font-medium", on ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink");
  const titles = ["About you", "Which calls are you preparing for?", "What do you already know is weak?", "You're set"];
  const subs = ["Your mentors read this before every session.", "Your mentors use this to pick questions. Add more later as calls come in.", "Be honest. It's how we aim your first mocks.", "Slots are open to you now."];

  return (
    <div className="flex max-w-[660px] flex-col gap-3.5">
      <div className="flex gap-1.5" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((n) => <span key={n} className={`h-[5px] flex-1 rounded-[3px] ${n <= step ? "bg-oxblood" : "bg-line"}`} />)}</div>
      <div className="rounded-[11px] border border-line bg-card p-5">
        <p className="type-label text-ink-faint">Step {step} of 4</p>
        <h2 className="mt-2 font-display text-xl font-bold leading-[1.25] text-ink">{titles[step - 1]}</h2>
        <p className="mt-[7px] text-[13px] leading-[1.55] text-ink-muted">{subs[step - 1]}</p>
        {step === 1 && (
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <Field label="College" value={d.college} onChange={(e) => setD({ ...d, college: e.target.value })} autoComplete="organization" />
            <Field label="Degree" value={d.degree} onChange={(e) => setD({ ...d, degree: e.target.value })} placeholder="e.g. B.Tech Mechanical" />
            <Field label="Work experience (months)" inputMode="numeric" value={d.workExMonths} onChange={(e) => setD({ ...d, workExMonths: e.target.value.replace(/\D/g, "") })} />
            <Field label="Mobile (for reminders)" type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} autoComplete="tel" />
          </div>
        )}
        {step === 2 && <div className="mt-4 flex flex-wrap gap-[7px]">{INSTITUTES.map((i) => <button key={i} type="button" aria-pressed={d.targetInstitutes.includes(i)} onClick={() => toggle("targetInstitutes", i)} className={chip(d.targetInstitutes.includes(i))}>{i}</button>)}</div>}
        {step === 3 && <div className="mt-4 flex flex-wrap gap-[7px]">{WEAK.map((i) => <button key={i} type="button" aria-pressed={d.weakAreas.includes(i)} onClick={() => toggle("weakAreas", i)} className={chip(d.weakAreas.includes(i))}>{i}</button>)}</div>}
        {step === 4 && <p className="mt-4 text-[13px] leading-[1.6] text-ink-2">We&apos;ve saved your profile. You can change any of it later in Settings. Head to the dashboard to book your first session.</p>}
        {err && <p role="alert" className="mt-3 text-xs text-oxblood">{err}</p>}
        <div className="mt-5 flex gap-2">
          {step > 1 && step < 4 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button onClick={next} disabled={busy}>{busy ? "Saving…" : step === 4 ? "Go to dashboard" : "Continue"}</Button>
        </div>
      </div>
    </div>
  );
}
