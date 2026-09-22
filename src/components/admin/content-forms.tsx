"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addFaqAction, addTestimonialAction, toggleFaqAction, toggleTestimonialAction } from "@/app/admin/actions";

export function TestimonialForm() {
  const router = useRouter();
  const [v, setV] = useState({ quote: "", who: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-col gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await addTestimonialAction(v); setBusy(false); setMsg(r.ok ? "Added." : r.error); if (r.ok) { setV({ quote: "", who: "" }); router.refresh(); } }}>
      <textarea required minLength={10} value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} placeholder="Quote" rows={2} className="w-full rounded-lg border border-line-strong bg-white p-2.5 text-[13px]" />
      <div className="flex gap-2"><input required value={v.who} onChange={(e) => setV({ ...v, who: e.target.value })} placeholder="— Name, converted [institute]" className="min-h-11 flex-1 rounded-lg border border-line-strong bg-white px-3 text-[13px]" /><Button type="submit" disabled={busy} size="sm">{busy ? "…" : "Add"}</Button></div>
      {msg && <p className={`text-xs ${msg === "Added." ? "text-green" : "text-oxblood"}`}>{msg}</p>}
    </form>
  );
}

export function TestimonialToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await toggleTestimonialAction(id, !published); setBusy(false); router.refresh(); }}>{busy ? "…" : published ? "Unpublish" : "Publish"}</Button>;
}

export function FaqForm() {
  const router = useRouter();
  const [v, setV] = useState({ question: "", answer: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-col gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await addFaqAction(v); setBusy(false); setMsg(r.ok ? "Added." : r.error); if (r.ok) { setV({ question: "", answer: "" }); router.refresh(); } }}>
      <input required value={v.question} onChange={(e) => setV({ ...v, question: e.target.value })} placeholder="Question" className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      <textarea required minLength={5} value={v.answer} onChange={(e) => setV({ ...v, answer: e.target.value })} placeholder="Answer" rows={2} className="w-full rounded-lg border border-line-strong bg-white p-2.5 text-[13px]" />
      <Button type="submit" disabled={busy} size="sm" className="self-start">{busy ? "…" : "Add"}</Button>
      {msg && <p className={`text-xs ${msg === "Added." ? "text-green" : "text-oxblood"}`}>{msg}</p>}
    </form>
  );
}

export function FaqToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await toggleFaqAction(id, !published); setBusy(false); router.refresh(); }}>{busy ? "…" : published ? "Unpublish" : "Publish"}</Button>;
}
