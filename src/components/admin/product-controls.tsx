"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCouponAction, toggleCouponAction, updateProductAction } from "@/app/admin/actions";

export function ProductRow({ id, name, pricePaise, mrpPaise, active }: { id: string; name: string; pricePaise: number; mrpPaise: number | null; active: boolean }) {
  const router = useRouter();
  const [v, setV] = useState({ price: (pricePaise / 100).toString(), mrp: mrpPaise ? (mrpPaise / 100).toString() : "", active });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <tr className="border-b border-line-soft last:border-b-0">
      <td className="px-3.5 py-2.5 text-ink-body">{name}</td>
      <td className="px-3.5 py-2"><input type="number" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} className="w-24 rounded-lg border border-line-strong bg-white px-2 py-1.5 text-[12.5px]" /></td>
      <td className="px-3.5 py-2"><input type="number" value={v.mrp} onChange={(e) => setV({ ...v, mrp: e.target.value })} placeholder="—" className="w-24 rounded-lg border border-line-strong bg-white px-2 py-1.5 text-[12.5px]" /></td>
      <td className="px-3.5 py-2"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /></td>
      <td className="px-3.5 py-2">
        <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); const r = await updateProductAction({ id, pricePaise: Math.round(Number(v.price) * 100), mrpPaise: v.mrp ? Math.round(Number(v.mrp) * 100) : undefined, active: v.active }); setBusy(false); setMsg(r.ok ? "Saved" : r.error); if (r.ok) router.refresh(); }}>{busy ? "…" : "Save"}</Button>
        {msg && <span className={`ml-2 text-[11px] ${msg === "Saved" ? "text-green" : "text-oxblood"}`}>{msg}</span>}
      </td>
    </tr>
  );
}

export function CouponForm() {
  const router = useRouter();
  const [v, setV] = useState({ code: "", type: "PERCENT", value: "10", maxUses: "", expiresAt: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="flex flex-wrap items-end gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await createCouponAction(v); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? "Created." : r.error }); if (r.ok) { setV({ code: "", type: "PERCENT", value: "10", maxUses: "", expiresAt: "" }); router.refresh(); } }}>
      <div><label className="type-label mb-1.5 block text-ink-faint">Code</label><input required value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} className="min-h-11 w-32 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Type</label><select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]"><option value="PERCENT">Percent</option><option value="FLAT">Flat (₹)</option></select></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Value</label><input type="number" required value={v.value} onChange={(e) => setV({ ...v, value: e.target.value })} className="min-h-11 w-20 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Max uses</label><input type="number" value={v.maxUses} onChange={(e) => setV({ ...v, maxUses: e.target.value })} placeholder="∞" className="min-h-11 w-20 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]" /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Expires</label><input type="date" value={v.expiresAt} onChange={(e) => setV({ ...v, expiresAt: e.target.value })} className="min-h-11 rounded-lg border border-line-strong bg-white px-2.5 text-[13px]" /></div>
      <Button type="submit" disabled={busy}>{busy ? "…" : "Create coupon"}</Button>
      {msg && <p className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await toggleCouponAction(id, !active); setBusy(false); router.refresh(); }}>{busy ? "…" : active ? "Deactivate" : "Activate"}</Button>;
}
