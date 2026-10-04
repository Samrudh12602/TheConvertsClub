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

export function RatingPicker({ sessionId, initial, initialComment = "", initialConsent = false }: { sessionId: string; initial: number | null; initialComment?: string; initialConsent?: boolean }) {
  const [val, setVal] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [comment, setComment] = useState(initialComment);
  const [consent, setConsent] = useState(initialConsent);
  const [saved, setSaved] = useState(false);
  return (
    <div className="w-full">
      <div className="flex gap-1.5" role="radiogroup" aria-label="Rate this session">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={val === n} disabled={pending}
            onClick={() => start(async () => { const r = await rateSessionAction(sessionId, n); if (r.ok) { setVal(n); setErr(null); } else setErr(r.error); })}
            className={clsx("flex size-10 items-center justify-center rounded-lg border text-[13px] font-semibold", val !== null && n <= val ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-faint hover:border-ink")}>{n}</button>
        ))}
      </div>
      {val !== null && (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={`c-${sessionId}`} className="text-xs font-medium text-ink-2">Anything you&apos;d tell a future student? (optional)</label>
          <textarea id={`c-${sessionId}`} value={comment} onChange={(e) => { setComment(e.target.value); setSaved(false); }} maxLength={500} rows={3} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-[13px] leading-[1.5]" />
          {comment.trim().length > 0 && (
            <label className="flex items-start gap-2 text-xs leading-[1.5] text-ink-2">
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setSaved(false); }} className="mt-0.5" />
              <span>You may show this on the website with just my first name and college. (Your mentor never sees it.)</span>
            </label>
          )}
          <div className="flex items-center gap-3">
            <button type="button" disabled={pending} onClick={() => start(async () => { const r = await rateSessionAction(sessionId, val, comment, consent); if (r.ok) { setSaved(true); setErr(null); } else setErr(r.error); })} className="rounded-lg border border-line-strong bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:border-ink">Save comment</button>
            {saved && <span role="status" className="text-xs text-green">Saved. Thank you.</span>}
          </div>
        </div>
      )}
      {err && <p role="alert" className="mt-1 text-xs text-oxblood">{err}</p>}
    </div>
  );
}
