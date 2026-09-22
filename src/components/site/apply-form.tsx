"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { mentorApplicationSchema, type MentorApplicationInput } from "@/lib/validation/forms";

export function ApplyForm() {
  const [busy, setBusy] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MentorApplicationInput>({ resolver: zodResolver(mentorApplicationSchema), mode: "onTouched" });

  async function submit(data: MentorApplicationInput, e?: React.BaseSyntheticEvent) {
    const fileInput = (e?.target as HTMLFormElement | undefined)?.elements.namedItem("photo") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setPhotoErr("Attach a professional photo.");
      return;
    }
    setPhotoErr(null);
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.set(k, v));
    fd.set("photo", file);
    const res = await fetch("/api/applications/submit", { method: "POST", body: fd });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setResult({ ok: false, text: j.error ?? "Something went wrong. Please try again." });
      return;
    }
    setResult({ ok: true, text: "Application received. We'll email you if we'd like to move forward." });
    reset();
    setPhotoName(null);
    fileInput.value = "";
  }

  return (
    <Card className="p-[22px]">
      <h2 className="type-section text-ink">Apply</h2>
      <form noValidate onSubmit={handleSubmit(submit)} aria-label="Mentor application">
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <Field label="Name" autoComplete="name" placeholder="Your full name" error={errors.name?.message} {...register("name")} />
          <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Field label="Phone" type="tel" autoComplete="tel" placeholder="+91" error={errors.phone?.message} {...register("phone")} />
          <Field label="Institute and batch" placeholder="e.g. IIM Lucknow, 2026" error={errors.institute?.message} {...register("institute")} />
          <Field label="Calls you converted" placeholder="Which ones, and in which season" error={errors.callsConverted?.message} {...register("callsConverted")} />
          <Field label="Hours a week you can take" inputMode="numeric" placeholder="Be honest — 4 is fine" error={errors.hoursPerWeek?.message} {...register("hoursPerWeek")} />
          <Field label="LinkedIn profile" type="url" placeholder="https://linkedin.com/in/…" error={errors.linkedinUrl?.message} {...register("linkedinUrl")} />
          <div>
            <label htmlFor="apply-photo" className="type-label mb-1.5 block text-ink-faint">
              Professional photo
            </label>
            <input
              id="apply-photo"
              name="photo"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                setPhotoName(e.target.files?.[0]?.name ?? null);
                if (e.target.files?.[0]) setPhotoErr(null);
              }}
              className="block w-full text-[13px] text-ink-2 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:text-[12.5px] file:font-semibold file:text-white"
            />
            {photoName && <p className="mt-1.5 text-xs text-ink-faint">{photoName}</p>}
            {photoErr && (
              <p role="alert" className="mt-1.5 text-xs text-oxblood">
                {photoErr}
              </p>
            )}
          </div>
        </div>
        <Button type="submit" size="lg" disabled={busy} className="mt-[18px] rounded-[9px]">
          {busy ? "Sending…" : "Send application"}
        </Button>
      </form>
      {result && (
        <Notice tone={result.ok ? "green" : "oxblood"} role={result.ok ? "status" : "alert"} className="mt-3">
          {result.text}
        </Notice>
      )}
    </Card>
  );
}
