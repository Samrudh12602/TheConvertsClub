"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inviteMentorAction } from "@/app/admin/actions";

export function InviteMentorForm() {
  const [v, setV] = useState({ email: "", tier: "JUNIOR" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-wrap items-end gap-2.5 rounded-[11px] border border-line bg-card p-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await inviteMentorAction(v); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Sent." : r.error }); if (r.ok) setV({ email: "", tier: "JUNIOR" }); }}>
      <div className="min-w-[220px] flex-1"><Field label="Invite a mentor by email" type="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} placeholder="mentor@example.com" /></div>
      <div>
        <label className="type-label mb-1.5 block text-ink-faint">Tier</label>
        <select value={v.tier} onChange={(e) => setV({ ...v, tier: e.target.value })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]"><option value="JUNIOR">Junior</option><option value="SENIOR">Senior</option></select>
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send invite"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}
