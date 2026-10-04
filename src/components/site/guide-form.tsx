"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export function GuideForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true); setErr(null);
        const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.get("email"), tips: f.get("tips") === "on", website: f.get("website") }) });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setBusy(false);
        if (!res.ok) return setErr(j.error ?? "Something went wrong. Please try again.");
        onDone();
      }}
    >
      <Field label="Your email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
      <label className="flex items-start gap-2.5 text-[12.5px] leading-[1.55] text-ink-2">
        <input type="checkbox" name="tips" className="mt-0.5 size-4 flex-none" />
        <span>Also send me occasional interview-prep tips (optional — you can say no and still get the checklist).</span>
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {err && <Notice tone="oxblood" role="alert">{err}</Notice>}
      <Button type="submit" size="lg" disabled={busy} className="self-start rounded-[9px]">{busy ? "Sending…" : "Send me the checklist"}</Button>
      <p className="text-[11.5px] leading-[1.5] text-ink-faint">We use your email only to send this and, if you ticked the box, tips. See our Privacy Policy. Ask us any time and we will delete it.</p>
    </form>
  );
}
