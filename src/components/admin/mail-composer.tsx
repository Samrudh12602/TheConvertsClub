"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bold, Eye, Heading, Link2, List, MousePointerClick, Paperclip, Quote, Send, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { sendMailAction } from "@/app/admin/mailbox/actions";
import type { MailTemplate } from "@/lib/mail-templates";
import { ATTACH_MAX_FILES, LOGO_URL, MAX_RECIPIENTS, SENDERS, attachmentProblem, composeHtml, fileSizeLabel, fillMergeFields, signatureText, type SenderKey } from "@/lib/mailbox";

type Audience = "SPECIFIC" | "ALL_STUDENTS" | "ALL_MENTORS";
type ToolKey = "heading" | "bold" | "list" | "box" | "button" | "link" | "name";
const TOOLS: { key: ToolKey; label: string; icon: typeof Bold }[] = [
  { key: "heading", label: "Heading", icon: Heading },
  { key: "bold", label: "Bold", icon: Bold },
  { key: "list", label: "List", icon: List },
  { key: "box", label: "Highlighted box", icon: Quote },
  { key: "button", label: "Button", icon: MousePointerClick },
  { key: "link", label: "Link", icon: Link2 },
  { key: "name", label: "First name", icon: UserRound },
];
const input = "min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-[13px]";

export interface ComposerDefaults {
  from?: SenderKey;
  to?: string;
  subject?: string;
  body?: string;
  thread?: { messageId: string | null; references: string[] } | null;
}

/** Write and send an email from support@, admin@ or samrudh@ to anyone: typed addresses, or every active student or mentor. */
export function MailComposer({ defaults = {}, doneHref, templates = [] }: { defaults?: ComposerDefaults; doneHref: string; templates?: MailTemplate[] }) {
  const [from, setFrom] = useState<SenderKey>(defaults.from ?? "support");
  const [audience, setAudience] = useState<Audience>("SPECIFIC");
  const [to, setTo] = useState(defaults.to ?? "");
  const [subject, setSubject] = useState(defaults.subject ?? "");
  const [body, setBody] = useState(defaults.body ?? "");
  const [signature, setSignature] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [ask, setAsk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const sender = SENDERS.find((s) => s.key === from)!;
  const bulk = audience !== "SPECIFIC";
  const who = audience === "ALL_STUDENTS" ? "every active student" : "every active mentor";

  /** Puts a snippet at the cursor (or over the selection), as its own block when asked, and selects the part to type over. */
  function insert(snippet: string, opts: { block?: boolean; select?: [number, number] } = {}) {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const before = body.slice(0, start);
    const lead = opts.block && before.trim() ? (before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n") : "";
    setBody(before + lead + snippet + body.slice(end));
    const base = before.length + lead.length;
    requestAnimationFrame(() => { el?.focus(); const [a, b] = opts.select ?? [snippet.length, snippet.length]; el?.setSelectionRange(base + a, base + b); });
  }
  function applyTool(key: ToolKey) {
    const el = bodyRef.current;
    const picked = el ? body.slice(el.selectionStart, el.selectionEnd) : "";
    if (key === "heading") { const t = picked || "Your heading"; insert(`# ${t}`, { block: true, select: [2, 2 + t.length] }); }
    else if (key === "bold") { const t = picked || "bold text"; insert(`**${t}**`, { select: [2, 2 + t.length] }); }
    else if (key === "list") insert("- First point\n- Second point", { block: true, select: [2, 13] });
    else if (key === "box") { const t = picked || "Something to stand out"; insert(`> ${t}`, { block: true, select: [2, 2 + t.length] }); }
    else if (key === "button") insert("[button: Button text | https://theconvertsclub.in]", { block: true, select: [9, 22] });
    else if (key === "name") insert("{{first_name}}");
    else { const t = picked || "link text"; insert(`[${t}](https://)`, { select: [t.length + 4, t.length + 8] }); }
  }

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if ((body.trim() || subject.trim()) && !window.confirm("Replace what you have written with this template?")) return;
    setFrom(t.from); setAudience(t.audience); setSubject(t.subject); setBody(t.body); setPreview(true);
  }

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)];
    const problem = attachmentProblem(next.map((f) => ({ name: f.name, size: f.size })), bulk);
    if (problem) { setError(problem); return; }
    setError(null);
    setFiles(next);
  }

  function send() {
    setError(null);
    const problem = attachmentProblem(files.map((f) => ({ name: f.name, size: f.size })), bulk);
    if (problem) { setError(problem); setAsk(false); return; }
    start(async () => {
      const form = new FormData();
      form.set("payload", JSON.stringify({ from, audience, to, subject, body, signature, thread: defaults.thread ?? null }));
      for (const f of files) form.append("files", f);
      const r = await sendMailAction(form);
      setAsk(false);
      if (r.ok) { toast.success(r.message); router.push(doneHref); router.refresh(); } else { setError(r.error); toast.error(r.error); }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); if (bulk) setAsk(true); else send(); }}>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title="Send to everyone in this group?" body={<>This sends a separate email from <b>{sender.address}</b> to {who}, up to {MAX_RECIPIENTS} people. A short opt-out line is added at the end. It cannot be unsent.</>} confirmLabel="Send" busy={pending} onConfirm={send} />
      {templates.length > 0 && (
        <div className="rounded-xl border border-oxblood-line bg-oxblood-tint/40 p-3.5">
          <label htmlFor="mc-tpl" className="type-label mb-1.5 block text-oxblood">Start from a ready-made email</label>
          <select id="mc-tpl" value="" onChange={(e) => applyTemplate(e.target.value)} className={input}>
            <option value="">Choose a template, or write your own below…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <p className="mt-1.5 text-[11.5px] leading-normal text-ink-faint">It fills in the subject and message, and you can change anything before sending. Prices and seats left come live from your Products page.</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="mc-from" className="type-label mb-1.5 block text-ink-faint">From</label>
          <select id="mc-from" value={from} onChange={(e) => setFrom(e.target.value as SenderKey)} className={input}>
            {SENDERS.map((s) => <option key={s.key} value={s.key}>{s.address}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mc-aud" className="type-label mb-1.5 block text-ink-faint">To</label>
          <select id="mc-aud" value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className={input}>
            <option value="SPECIFIC">Specific people (type addresses)</option>
            <option value="ALL_STUDENTS">All active students</option>
            <option value="ALL_MENTORS">All active mentors</option>
          </select>
        </div>
      </div>
      {!bulk && (
        <div>
          <label htmlFor="mc-to" className="type-label mb-1.5 block text-ink-faint">Email addresses</label>
          <textarea id="mc-to" required rows={2} value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com, another@example.com" className="w-full rounded-lg border border-line-strong bg-white p-3 text-[13px] leading-normal" />
          <p className="mt-1 text-[11.5px] text-ink-faint">Separate with commas, spaces or new lines. Each person gets their own email and cannot see the others.</p>
        </div>
      )}
      {bulk && <p className="rounded-lg bg-surface px-3 py-2.5 text-[12.5px] leading-normal text-ink-muted">Goes to {who}, each as a separate email. Demo and test addresses are skipped.</p>}
      <div>
        <label htmlFor="mc-sub" className="type-label mb-1.5 block text-ink-faint">Subject</label>
        <input id="mc-sub" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="mc-body" className="type-label mb-1.5 block text-ink-faint">Message</label>
        <div className="mb-1.5 flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting">
          {TOOLS.map((t) => (
            <button key={t.key} type="button" onClick={() => applyTool(t.key)} title={t.label} aria-label={t.label} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 text-[12px] font-medium text-ink-2 hover:border-ink"><t.icon className="size-3.5" aria-hidden /> {t.label}</button>
          ))}
          <button type="button" onClick={() => setPreview((v) => !v)} aria-pressed={preview} className={`ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold ${preview ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-2 hover:border-ink"}`}><Eye className="size-3.5" aria-hidden /> {preview ? "Back to writing" : "Preview"}</button>
        </div>
        {preview ? (
          <iframe title="Preview of the email" sandbox="" srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:16px;background:#fff">${composeHtml(fillMergeFields(body.trim() || "(Your message appears here.)", "Priya"), signature ? sender : null, LOGO_URL)}</body>`} className="h-[560px] w-full rounded-lg border border-line-strong bg-white" />
        ) : (
          <textarea id="mc-body" ref={bodyRef} required rows={11} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white p-3 text-[13.5px] leading-[1.6]" />
        )}
        <p className="mt-1 text-[11.5px] leading-normal text-ink-faint">Use the buttons above for headings, bold, lists, highlighted boxes, buttons and links. <b>First name</b> becomes each person&rsquo;s own first name (or &ldquo;there&rdquo;). <b>Preview</b> shows exactly what the reader sees, using &ldquo;Priya&rdquo; as the example.</p>
      </div>
      <label className="flex items-start gap-2 text-[12.5px] text-ink-muted">
        <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} className="mt-0.5 size-4" />
        <span>Add the signature for {sender.address}<span className="mt-1 block whitespace-pre-line text-[11.5px] text-ink-faint">{signatureText(sender)}</span></span>
      </label>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3.5 text-[12.5px] font-medium text-ink-2 shadow-xs hover:border-ink ${files.length >= ATTACH_MAX_FILES ? "pointer-events-none opacity-60" : ""}`}>
            <Paperclip className="size-4" aria-hidden /> Attach files
            <input type="file" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <span className="text-[11.5px] text-ink-faint">Up to {ATTACH_MAX_FILES} files, 15 MB in all{bulk ? " (3 MB when sending to a group)" : ""}.</span>
        </div>
        {files.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Attachments">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[12px] text-ink-2">
                <Paperclip className="size-3.5 text-ink-faint" aria-hidden /> {f.name} <span className="text-ink-faint">{fileSizeLabel(f.size)}</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="ml-0.5 text-ink-faint hover:text-oxblood"><X className="size-3.5" aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p role="alert" className="text-[12.5px] text-oxblood">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}><Send className="size-4" aria-hidden /> {pending ? "Sending…" : "Send"}</Button>
        <span className="text-[11.5px] text-ink-faint">Replies come to {sender.address}. The logo goes at the bottom of every email.</span>
      </div>
    </form>
  );
}
