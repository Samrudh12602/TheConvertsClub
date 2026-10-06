"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { sendBroadcastAction } from "@/app/admin/actions";

export function BroadcastForm() {
  const [v, setV] = useState({ audience: "ALL_STUDENTS", subject: "", body: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const toast = useToast();
  const who = v.audience === "ALL_STUDENTS" ? "all active students" : "all active mentors";
  async function send() {
    setBusy(true); const r = await sendBroadcastAction(v); setBusy(false); setAsk(false);
    setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Sent." : r.error });
    if (r.ok) { toast.success(r.message ?? "Broadcast sent."); setV({ ...v, subject: "", body: "" }); } else toast.error(r.error);
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setAsk(true); }}>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title="Send this broadcast?" body={`It goes by email to ${who}.`} confirmLabel="Send" busy={busy} onConfirm={send} />
      <div>
        <label className="type-label mb-1.5 block text-ink-faint">Audience</label>
        <select value={v.audience} onChange={(e) => setV({ ...v, audience: e.target.value })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]"><option value="ALL_STUDENTS">All students</option><option value="ALL_MENTORS">All mentors</option></select>
      </div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Subject</label><input required value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value })} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-[13px]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Message</label><textarea required rows={5} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} className="w-full rounded-lg border border-line-strong bg-white p-3 text-[13px] leading-normal" /></div>
      <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send broadcast"}</Button>
      {msg && <p className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}
