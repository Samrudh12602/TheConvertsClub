"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const KIND_LABEL: Record<string, string> = { WAT: "WAT evaluation", SOP_BASIC: "Basic SOP review", SOP_DETAILED: "Detailed SOP review" };

export function ReviewUpload({ kinds, uploadsEnabled }: { kinds: string[]; uploadsEnabled: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState(kinds[0] ?? "");
  const [mode, setMode] = useState<"file" | "text">(uploadsEnabled ? "file" : "text");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!kinds.length) return <div className="rounded-[11px] border border-dashed border-[#CFC6B9] bg-card p-6 text-center text-[13px] leading-normal text-ink-muted">You have no WAT or SOP credits left. You can buy one on the Payments page.</div>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("kind", kind);
    if (mode === "text") fd.delete("file"); else fd.delete("text");
    const res = await fetch("/api/reviews/upload", { method: "POST", body: fd });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) { setMsg({ ok: false, text: j.error ?? "Upload failed." }); return; }
    setMsg({ ok: true, text: "Submitted. A mentor will review it within the turnaround time." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-[11px] border border-dashed border-[#CFC6B9] bg-card p-6">
      <h2 className="text-center font-display text-[15px] font-bold leading-[1.3] text-ink">Submit your WAT or SOP</h2>
      <p className="mx-auto mt-1.5 max-w-[52ch] text-center text-[12.5px] leading-normal text-ink-faint">PDF or DOCX, up to 5 MB. Files stay private and are visible only to your assigned mentor and Samrudh.</p>
      <div className="mx-auto mt-4 flex max-w-[460px] flex-col gap-3">
        <div>
          <label htmlFor="kind" className="type-label mb-1.5 block text-ink-faint">What are you submitting</label>
          <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]">
            {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="type-label mb-1.5 block text-ink-faint">Title (optional)</label>
          <input id="title" name="title" maxLength={120} placeholder="e.g. Ethics in AI" className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]" />
        </div>
        <div className="flex gap-2" role="tablist" aria-label="How to submit">
          {uploadsEnabled && <button type="button" role="tab" aria-selected={mode === "file"} onClick={() => setMode("file")} className={`min-h-10 flex-1 rounded-lg border text-[12.5px] font-medium ${mode === "file" ? "border-ink bg-ink text-surface" : "border-line-strong bg-white"}`}>Upload file</button>}
          <button type="button" role="tab" aria-selected={mode === "text"} onClick={() => setMode("text")} className={`min-h-10 flex-1 rounded-lg border text-[12.5px] font-medium ${mode === "text" ? "border-ink bg-ink text-surface" : "border-line-strong bg-white"}`}>Paste text</button>
        </div>
        {mode === "file" ? (
          <input name="file" type="file" accept=".pdf,.docx" required className="block w-full text-[13px] text-ink-2 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-oxblood file:px-4 file:text-[12.5px] file:font-semibold file:text-white" />
        ) : (
          <textarea name="text" required minLength={50} rows={7} placeholder="Paste your essay or statement here" className="w-full rounded-lg border border-line-strong bg-white p-3 text-base leading-normal text-ink md:text-[13px]" />
        )}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs leading-normal ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
