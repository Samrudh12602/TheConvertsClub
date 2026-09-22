"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { refundOrderAction } from "@/app/admin/actions";

export function RefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <Button size="sm" variant="quiet" onClick={() => setOpen(true)}>Refund</Button>;
  return (
    <form className="flex items-center gap-1.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await refundOrderAction({ orderId, reason }); setBusy(false); if (!r.ok) setErr(r.error); else { setOpen(false); router.refresh(); } }}>
      <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="min-h-9 w-40 rounded-lg border border-line-strong bg-white px-2 text-xs" />
      <Button type="submit" size="sm" variant="quiet" disabled={busy}>{busy ? "…" : "Confirm full refund"}</Button>
      {err && <span className="text-[11px] text-oxblood">{err}</span>}
    </form>
  );
}
