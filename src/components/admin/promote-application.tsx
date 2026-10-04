"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { promoteApplicationAction } from "@/app/admin/actions";

/**
 * The one real "approve" action: creates the mentor's account and emails them a login link.
 * Confirmation is inline (not window.confirm), because browser pop-ups are silently suppressed in
 * some browsers and embedded views, which made this button look dead.
 */
export function PromoteButton({ applicationId, defaultTier }: { applicationId: string; defaultTier: "JUNIOR" | "SENIOR" }) {
  const router = useRouter();
  const [tier, setTier] = useState(defaultTier);
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const approve = () => start(async () => {
    setErr(null);
    const r = await promoteApplicationAction(applicationId, tier);
    if (!r.ok) { setErr(r.error); setConfirming(false); } else router.refresh();
  });

  return (
    <div className="flex flex-col items-end gap-1.5">
      {!confirming ? (
        <div className="flex gap-1.5">
          <select aria-label="Tier" value={tier} onChange={(e) => setTier(e.target.value as "JUNIOR" | "SENIOR")} className="min-h-9 rounded-lg border border-line-strong bg-white px-2 text-xs">
            <option value="JUNIOR">Junior</option>
            <option value="SENIOR">Senior</option>
          </select>
          <Button size="sm" onClick={() => { setErr(null); setConfirming(true); }}>Approve as mentor</Button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1.5 rounded-lg border border-line-strong bg-surface p-2.5">
          <p className="max-w-[230px] text-right text-[12px] leading-[1.4] text-ink-2">Create a <strong>{tier === "JUNIOR" ? "Junior" : "Senior"}</strong> mentor account and email them a login link?</p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
            <Button size="sm" disabled={pending} onClick={approve}>{pending ? "Approving…" : "Yes, approve"}</Button>
          </div>
        </div>
      )}
      {err && <p role="alert" className="max-w-[240px] text-right text-[11.5px] leading-[1.35] text-oxblood">{err}</p>}
    </div>
  );
}
