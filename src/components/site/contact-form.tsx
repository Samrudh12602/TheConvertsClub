"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const TOPICS = ["Payments & receipts", "Booking a session", "Becoming a mentor", "Something isn't working", "Something else"];

export function ContactForm({ defaultName = "", defaultEmail = "" }: { defaultName?: string; defaultEmail?: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) return setResult({ ok: false, text: j.error ?? "Something went wrong. Please try again." });
    setResult({ ok: true, text: "Message sent. We've emailed you a confirmation and will reply within a day." });
    form.reset();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Your name" name="name" required defaultValue={defaultName} autoComplete="name" />
        <Field label="Email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" inputMode="email" />
      </div>
      <div>
        <label htmlFor="topic" className="type-label mb-1.5 block text-ink-faint">What&apos;s it about?</label>
        <select id="topic" name="topic" className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]">
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="type-label mb-1.5 block text-ink-faint">Message</label>
        <textarea id="message" name="message" required minLength={10} maxLength={3000} rows={6} className="w-full rounded-lg border border-line-strong bg-white px-3 py-3 text-base leading-[1.5] text-ink md:text-[13px]" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {result && <Notice tone={result.ok ? "green" : "oxblood"} role={result.ok ? "status" : "alert"}>{result.text}</Notice>}
      <Button type="submit" size="lg" disabled={busy} className="self-start rounded-[9px]">{busy ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
