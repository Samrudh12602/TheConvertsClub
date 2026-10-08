"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addFaqAction, addResourceAction, addSeasonStatAction, addTestimonialAction, publishRatingAsTestimonialAction, deleteResourceAction, deleteSeasonStatAction, toggleFaqAction, toggleTestimonialAction } from "@/app/admin/actions";

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

/** Feeds the stat tiles on /results, e.g. "240" / "students prepared last season". */
export function SeasonStatForm() {
  const router = useRouter();
  const [v, setV] = useState({ value: "", label: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await addSeasonStatAction(v); setBusy(false); setMsg(r.ok ? "Added." : r.error); if (r.ok) { setV({ value: "", label: "" }); router.refresh(); } }}>
      <input required value={v.value} onChange={(e) => setV({ ...v, value: e.target.value })} placeholder="240" className="min-h-11 w-[90px] rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      <input required value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder="students prepared last season" className="min-h-11 flex-1 rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      <Button type="submit" disabled={busy} size="sm">{busy ? "…" : "Add"}</Button>
      {msg && <p className={`text-xs ${msg === "Added." ? "text-green" : "text-oxblood"}`}>{msg}</p>}
    </form>
  );
}

export function SeasonStatDelete({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await deleteSeasonStatAction(id); setBusy(false); router.refresh(); }}>{busy ? "…" : "Remove"}</Button>;
}

export function TestimonialToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await toggleTestimonialAction(id, !published); setBusy(false); router.refresh(); }}>{busy ? "…" : published ? "Unpublish" : "Publish"}</Button>;
}

export function FeatureButton({ ratingId }: { ratingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" disabled={busy} onClick={async () => { setBusy(true); const r = await publishRatingAsTestimonialAction(ratingId); setBusy(false); if (r.ok) router.refresh(); else setErr(r.error); }}>{busy ? "…" : "Publish"}</Button>
      {err && <p role="alert" className="max-w-[180px] text-right text-[11px] text-oxblood">{err}</p>}
    </div>
  );
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

/** Feeds both /student/library and /mentor/resources — pick the audience per item. */
export function ResourceForm() {
  const router = useRouter();
  const [v, setV] = useState({ audience: "STUDENT" as "STUDENT" | "MENTOR", kind: "", title: "", meta: "", url: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-col gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await addResourceAction(v); setBusy(false); setMsg(r.ok ? "Added." : r.error); if (r.ok) { setV({ ...v, kind: "", title: "", meta: "", url: "" }); router.refresh(); } }}>
      <div className="flex gap-2">
        <select aria-label="Audience" value={v.audience} onChange={(e) => setV({ ...v, audience: e.target.value as "STUDENT" | "MENTOR" })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]">
          <option value="STUDENT">Student library</option>
          <option value="MENTOR">Mentor resources</option>
        </select>
        <input required value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })} placeholder="Kind, e.g. Guide" className="min-h-11 w-[130px] rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      </div>
      <input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Title" className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      <div className="flex gap-2">
        <input value={v.meta} onChange={(e) => setV({ ...v, meta: e.target.value })} placeholder="Meta, e.g. 8 min read (optional)" className="min-h-11 flex-1 rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
        <input value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} placeholder="Link (optional)" className="min-h-11 flex-1 rounded-lg border border-line-strong bg-white px-3 text-[13px]" />
      </div>
      <Button type="submit" disabled={busy} size="sm" className="self-start">{busy ? "…" : "Add"}</Button>
      {msg && <p className={`text-xs ${msg === "Added." ? "text-green" : "text-oxblood"}`}>{msg}</p>}
    </form>
  );
}

export function ResourceDelete({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await deleteResourceAction(id); setBusy(false); router.refresh(); }}>{busy ? "…" : "Remove"}</Button>;
}
