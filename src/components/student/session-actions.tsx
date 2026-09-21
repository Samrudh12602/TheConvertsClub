"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button, ButtonLink } from "@/components/ui/button";
import { cancelSessionAction, rateSessionAction } from "@/app/student/actions";

export function SessionActions({ id, canMove, policyNote }: { id: string; canMove: boolean; policyNote: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canMove && <ButtonLink href={`/student/book?reschedule=${id}`} variant="secondary">Reschedule</ButtonLink>}
        <Button variant="quiet" disabled={pending} onClick={() => start(async () => {
          setErr(null);
          if (!confirm(`Cancel this session? ${policyNote}`)) return;
          const r = await cancelSessionAction(id);
          if (!r.ok) setErr(r.error); else router.push("/student/sessions");
        })}>{pending ? "Cancelling…" : "Cancel session"}</Button>
      </div>
      <p className="text-[11.5px] leading-normal text-ink-faint">{policyNote}</p>
      {err && <p role="alert" className="text-xs text-oxblood">{err}</p>}
    </div>
  );
}

export function RatingPicker({ sessionId, initial }: { sessionId: string; initial: number | null }) {
  const [val, setVal] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Rate this session">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={val === n} disabled={pending}
            onClick={() => start(async () => { const r = await rateSessionAction(sessionId, n); if (r.ok) { setVal(n); setErr(null); } else setErr(r.error); })}
            className={clsx("flex size-10 items-center justify-center rounded-lg border text-[13px] font-semibold", val !== null && n <= val ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-faint hover:border-ink")}>{n}</button>
        ))}
      </div>
      {err && <p role="alert" className="mt-1 text-xs text-oxblood">{err}</p>}
    </div>
  );
}
