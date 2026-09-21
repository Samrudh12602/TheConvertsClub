"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { addCallAction, setCallOutcomeAction } from "@/app/student/actions";

export function AddCall() {
  const router = useRouter();
  type Result = Awaited<ReturnType<typeof addCallAction>> | null;
  const [state, action, pending] = useActionState<Result, FormData>(async (_prev, fd) => { const r = await addCallAction(null, fd); if (r.ok) router.refresh(); return r; }, null);
  return (
    <form action={action} className="rounded-[10px] border border-line bg-card p-3.5">
      <p className="text-[13.5px] font-bold text-ink">Add a call</p>
      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Field label="Institute" name="institute" required placeholder="e.g. IIM Lucknow" />
        <Field label="Interview date" name="interviewDate" type="date" />
        <Field label="Stage / place" name="stage" placeholder="e.g. GD + PI, Delhi" />
      </div>
      <Button type="submit" disabled={pending} className="mt-3" variant="dark">{pending ? "Adding…" : "Add call"}</Button>
      {state && !state.ok && <p role="alert" className="mt-2 text-xs text-oxblood">{state.error}</p>}
    </form>
  );
}

export function OutcomeSelect({ id, value }: { id: string; value: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select aria-label="Outcome" defaultValue={value} disabled={pending} onChange={(e) => start(async () => { await setCallOutcomeAction(id, e.target.value as never); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2 text-[12.5px] text-ink">
      <option value="SCHEDULED">Scheduled</option><option value="WAITING">Waiting</option><option value="CONVERTED">Converted</option><option value="REJECTED">Not converted</option>
    </select>
  );
}
