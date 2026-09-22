"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignSessionAction, confirmRequestedAction, adminCancelSessionAction } from "@/app/admin/actions";

export function AssignPicker({ sessionId, options, suggestedId }: { sessionId: string; options: { id: string; label: string }[]; suggestedId?: string | null }) {
  const router = useRouter();
  const [val, setVal] = useState(suggestedId ?? options[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (options.length === 0) return <p className="text-xs text-ink-faint">No mentor free at this time.</p>;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <select value={val} onChange={(e) => setVal(e.target.value)} className="min-h-9 rounded-lg border border-line-strong bg-white px-2 text-xs">{options.map((o) => <option key={o.id} value={o.id}>{o.label}{o.id === suggestedId ? " (suggested)" : ""}</option>)}</select>
        <Button size="sm" disabled={pending} onClick={() => start(async () => { setErr(null); const r = await assignSessionAction(sessionId, val); if (!r.ok) setErr(r.error); else router.refresh(); })}>{pending ? "…" : "Assign"}</Button>
      </div>
      {err && <p role="alert" className="text-[11px] text-oxblood">{err}</p>}
    </div>
  );
}

export function ConfirmButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { await confirmRequestedAction(sessionId); router.refresh(); })}>{pending ? "…" : "Confirm"}</Button>;
}

export function AdminCancelButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <Button size="sm" variant="quiet" disabled={pending} onClick={() => { if (confirm("Cancel this session?")) start(async () => { await adminCancelSessionAction(sessionId); router.refresh(); }); }}>{pending ? "…" : "Cancel"}</Button>;
}
