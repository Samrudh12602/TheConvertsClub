"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setMentorPublicVisibleAction, setMentorStatusAction, setMentorTierAction, updateMentorCouponAction } from "@/app/admin/actions";

export function TierSelect({ mentorId, tier }: { mentorId: string; tier: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} defaultValue={tier} onChange={(e) => start(async () => { await setMentorTierAction(mentorId, e.target.value); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
      <option value="JUNIOR">Junior</option><option value="SENIOR">Senior</option>
    </select>
  );
}

export function StatusSelect({ mentorId, status }: { mentorId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} defaultValue={status} onChange={(e) => start(async () => { await setMentorStatusAction(mentorId, e.target.value); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
      <option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="OFFBOARDED">Offboarded</option>
    </select>
  );
}

/** Independent of status: a mentor can keep working and taking sessions while hidden from /mentors. */
export function PublicVisibleToggle({ mentorId, publicVisible }: { mentorId: string; publicVisible: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setMentorPublicVisibleAction(mentorId, !publicVisible); router.refresh(); })}
      className={`min-h-10 rounded-lg border px-2.5 text-[12.5px] font-semibold ${publicVisible ? "border-line-strong bg-white text-ink-2" : "border-oxblood-line bg-oxblood-tint text-oxblood"}`}
    >
      {pending ? "…" : publicVisible ? "Visible on /mentors" : "Hidden from /mentors"}
    </button>
  );
}

interface MentorCoupon { code: string; type: "PERCENT" | "FLAT"; value: number; maxUses: number | null; active: boolean }

/** Admin's full control over one mentor's referral coupon — code, discount, a use cap, on/off. */
export function MentorCouponEditor({ mentorId, coupon }: { mentorId: string; coupon: MentorCoupon }) {
  const router = useRouter();
  const [v, setV] = useState({ code: coupon.code, type: coupon.type, value: String(coupon.value), maxUses: coupon.maxUses ? String(coupon.maxUses) : "", active: coupon.active });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    const r = await updateMentorCouponAction(mentorId, { code: v.code, type: v.type, value: Number(v.value), maxUses: v.maxUses, active: v.active });
    setBusy(false);
    setMsg({ ok: r.ok, text: r.ok ? "Saved." : r.error });
    if (r.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-2.5 rounded-lg border border-line-soft bg-surface p-3">
      <div><label className="type-label mb-1.5 block text-ink-faint">Code</label><input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} maxLength={16} className="min-h-10 w-36 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold tracking-[0.05em]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Type</label><select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value as "PERCENT" | "FLAT" })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px]"><option value="PERCENT">Percent</option><option value="FLAT">Flat (₹)</option></select></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Value</label><input type="number" value={v.value} onChange={(e) => setV({ ...v, value: e.target.value })} className="min-h-10 w-20 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Max uses</label><input type="number" value={v.maxUses} onChange={(e) => setV({ ...v, maxUses: e.target.value })} placeholder="∞" className="min-h-10 w-20 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px]" /></div>
      <label className="flex min-h-10 items-center gap-1.5 text-[12.5px] text-ink-2"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active</label>
      <Button size="sm" disabled={busy} onClick={save}>{busy ? "…" : "Save"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </div>
  );
}
