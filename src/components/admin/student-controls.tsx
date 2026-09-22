"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { adjustCreditAction, setStudentStatusAction } from "@/app/admin/actions";

const KINDS = ["PI", "GD", "WAT", "SOP_BASIC", "SOP_DETAILED", "SOP_REVISION", "STRATEGY", "GUIDANCE"];

export function CreditAdjustForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [v, setV] = useState({ kind: "PI", delta: "1", reason: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-wrap items-end gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await adjustCreditAction({ userId, ...v }); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? "Adjusted." : r.error }); if (r.ok) { setV({ ...v, reason: "" }); router.refresh(); } }}>
      <div>
        <label className="type-label mb-1.5 block text-ink-faint">Credit</label>
        <select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]">{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
      </div>
      <div className="w-20"><Field label="Delta" type="number" value={v.delta} onChange={(e) => setV({ ...v, delta: e.target.value })} /></div>
      <div className="min-w-[200px] flex-1"><Field label="Reason" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} required /></div>
      <Button type="submit" disabled={busy} variant="secondary">{busy ? "…" : "Adjust"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}

export function StudentStatusToggle({ userId, status }: { userId: string; status: "ACTIVE" | "SUSPENDED" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant={status === "ACTIVE" ? "quiet" : "secondary"} disabled={pending} onClick={() => start(async () => { await setStudentStatusAction(userId, status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"); router.refresh(); })}>
      {pending ? "…" : status === "ACTIVE" ? "Suspend" : "Reactivate"}
    </Button>
  );
}
