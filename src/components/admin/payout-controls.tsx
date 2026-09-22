"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveAccrualsAction, approveBonusesAction, createPayoutRunAction, markPayoutPaidAction, previewBonusesAction } from "@/app/admin/actions";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Done." : r.error ?? "Failed." }); if (r.ok) router.refresh(); });
  return { pending, msg, run };
}

export function ApproveAccrualsButton() {
  const { pending, msg, run } = useAction();
  return <div className="flex flex-col items-start gap-1"><Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => approveAccrualsAction())}>{pending ? "…" : "Approve all accrued"}</Button>{msg && <p className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}</div>;
}
export function ApproveBonusesButton() {
  const { pending, msg, run } = useAction();
  return <div className="flex flex-col items-start gap-1"><Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => approveBonusesAction())}>{pending ? "…" : "Approve all bonuses"}</Button>{msg && <p className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}</div>;
}
export function PreviewBonusesButton() {
  const { pending, msg, run } = useAction();
  return <div className="flex flex-col items-start gap-1"><Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => previewBonusesAction())}>{pending ? "…" : "Compute this period's bonuses"}</Button>{msg && <p className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}</div>;
}

export function CreateRunForm() {
  const [label, setLabel] = useState("");
  const { pending, msg, run } = useAction();
  return (
    <form className="flex flex-wrap items-end gap-2.5" onSubmit={(e) => { e.preventDefault(); run(() => createPayoutRunAction(label)); }}>
      <div><label className="type-label mb-1.5 block text-ink-faint">Run label</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. January payout" className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[13px]" /></div>
      <Button type="submit" disabled={pending}>{pending ? "…" : "Create payout run from approved"}</Button>
      {msg && <p className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}

export function MarkPaidForm({ payoutId }: { payoutId: string }) {
  const [reference, setReference] = useState("");
  const { pending, msg, run } = useAction();
  return (
    <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); run(() => markPayoutPaidAction(payoutId, reference)); }}>
      <input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / reference" className="min-h-9 w-32 rounded-lg border border-line-strong bg-white px-2 text-xs" />
      <Button type="submit" size="sm" disabled={pending}>{pending ? "…" : "Mark paid"}</Button>
      {msg && !msg.ok && <p className="text-[11px] text-oxblood">{msg.text}</p>}
    </form>
  );
}
