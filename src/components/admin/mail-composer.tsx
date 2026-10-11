"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { sendMailAction } from "@/app/admin/mailbox/actions";
import { MAX_RECIPIENTS, SENDERS, type SenderKey } from "@/lib/mailbox";

type Audience = "SPECIFIC" | "ALL_STUDENTS" | "ALL_MENTORS";
const input = "min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-[13px]";

export interface ComposerDefaults {
  from?: SenderKey;
  to?: string;
  subject?: string;
  body?: string;
  thread?: { messageId: string | null; references: string[] } | null;
}

/** Write and send an email from support@, admin@ or samrudh@ to anyone: typed addresses, or every active student or mentor. */
export function MailComposer({ defaults = {}, doneHref }: { defaults?: ComposerDefaults; doneHref: string }) {
  const [from, setFrom] = useState<SenderKey>(defaults.from ?? "support");
  const [audience, setAudience] = useState<Audience>("SPECIFIC");
  const [to, setTo] = useState(defaults.to ?? "");
  const [subject, setSubject] = useState(defaults.subject ?? "");
  const [body, setBody] = useState(defaults.body ?? "");
  const [signature, setSignature] = useState(true);
  const [ask, setAsk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const sender = SENDERS.find((s) => s.key === from)!;
  const bulk = audience !== "SPECIFIC";
  const who = audience === "ALL_STUDENTS" ? "every active student" : "every active mentor";

  function send() {
    setError(null);
    start(async () => {
      const r = await sendMailAction({ from, audience, to, subject, body, signature, thread: defaults.thread ?? null });
      setAsk(false);
      if (r.ok) { toast.success(r.message); router.push(doneHref); router.refresh(); } else { setError(r.error); toast.error(r.error); }
    });
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); if (bulk) setAsk(true); else send(); }}>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title="Send to everyone in this group?" body={<>This sends a separate email from <b>{sender.address}</b> to {who}, up to {MAX_RECIPIENTS} people. A short opt-out line is added at the end. It cannot be unsent.</>} confirmLabel="Send" busy={pending} onConfirm={send} />
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
        <textarea id="mc-body" required rows={11} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white p-3 text-[13.5px] leading-[1.6]" />
      </div>
      <label className="flex items-start gap-2 text-[12.5px] text-ink-muted">
        <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} className="mt-0.5 size-4" />
        <span>Add the signature for {sender.address}<span className="mt-1 block whitespace-pre-line text-[11.5px] text-ink-faint">{sender.signature}</span></span>
      </label>
      {error && <p role="alert" className="text-[12.5px] text-oxblood">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}><Send className="size-4" aria-hidden /> {pending ? "Sending…" : "Send"}</Button>
        <span className="text-[11.5px] text-ink-faint">Replies come to {sender.address}.</span>
      </div>
    </form>
  );
}
