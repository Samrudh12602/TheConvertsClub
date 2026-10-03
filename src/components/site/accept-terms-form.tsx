"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptTermsAction, type AcceptState } from "@/app/(public)/accept-terms/actions";
import { signOutAction } from "@/app/actions/auth";

export interface AcceptDoc { key: string; label: string; blurb: string }

export function AcceptTermsForm({ docs, mentor }: { docs: AcceptDoc[]; mentor: boolean }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptTermsAction, {});
  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <ul className="flex flex-col gap-2.5">
        {docs.map((d) => (
          <li key={d.key} className="rounded-[10px] border border-line-soft bg-surface p-3.5">
            <Link href={`/${d.key}`} target="_blank" className="text-[13.5px] font-semibold">{d.label} ↗</Link>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-ink-muted">{d.blurb}</p>
          </li>
        ))}
      </ul>
      <label className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-ink-2">
        <input type="checkbox" name="agree" className="mt-1 size-4 flex-none" />
        <span>I have read and agree to the {docs.map((d) => d.label).join(", ").replace(/, ([^,]*)$/, " and $1")}.</span>
      </label>
      {mentor && (
        <label className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-ink-2">
          <input type="checkbox" name="mentorTruth" className="mt-1 size-4 flex-none" />
          <span>I confirm the details I gave about my college, batch and background are true, and that I will keep students&apos; information confidential.</span>
        </label>
      )}
      {state.error && <p role="alert" className="text-xs text-oxblood">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending} className="rounded-[9px]">{pending ? "Saving…" : "Agree and continue"}</Button>
        <button type="button" onClick={() => signOutAction()} className="text-xs text-ink-faint underline">No thanks, sign me out</button>
      </div>
    </form>
  );
}
