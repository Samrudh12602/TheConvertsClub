"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { saveProfileAction } from "@/app/mentor/actions";

export function ProfileForm({ initial, payoutMasked }: { initial: { bio: string; meetingUrl: string; status: "ACTIVE" | "PAUSED" }; payoutMasked: string }) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial, upi: "", accountName: "", accountNumber: "", ifsc: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex max-w-[660px] flex-col gap-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await saveProfileAction(v); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? "Saved." : r.error }); if (r.ok) router.refresh(); }}>
      <div className="rounded-[10px] border border-line bg-card p-4">
        <label htmlFor="bio" className="type-label mb-1.5 block text-ink-faint">Bio (two lines on the public mentors page)</label>
        <textarea id="bio" maxLength={300} rows={3} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} className="w-full rounded-lg border border-line-strong bg-white p-3 text-base leading-normal md:text-[13px]" />
        <div className="mt-3"><Field label="Meeting link (used for every session assigned to you)" type="url" value={v.meetingUrl} onChange={(e) => setV({ ...v, meetingUrl: e.target.value })} placeholder="https://meet.google.com/…" /></div>
        <div className="mt-3">
          <label htmlFor="status" className="type-label mb-1.5 block text-ink-faint">Status</label>
          <select id="status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as "ACTIVE" | "PAUSED" })} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base md:text-[13px]"><option value="ACTIVE">Active</option><option value="PAUSED">Paused (no new assignments)</option></select>
        </div>
      </div>
      <div className="rounded-[10px] border border-line bg-card p-4">
        <p className="text-[13px] font-semibold text-ink">Payout account</p>
        <p className="mt-1 text-xs leading-normal text-ink-faint">Encrypted at rest. Current: {payoutMasked}. Enter new details only to replace them.</p>
        <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Field label="UPI id" value={v.upi} onChange={(e) => setV({ ...v, upi: e.target.value })} autoComplete="off" />
          <Field label="Account holder" value={v.accountName} onChange={(e) => setV({ ...v, accountName: e.target.value })} autoComplete="off" />
          <Field label="Account number" value={v.accountNumber} onChange={(e) => setV({ ...v, accountNumber: e.target.value })} autoComplete="off" />
          <Field label="IFSC" value={v.ifsc} onChange={(e) => setV({ ...v, ifsc: e.target.value.toUpperCase() })} autoComplete="off" />
        </div>
      </div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>{msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}</div>
    </form>
  );
}
