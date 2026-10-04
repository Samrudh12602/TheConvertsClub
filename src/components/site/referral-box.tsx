"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { applyReferralAction } from "@/app/(public)/referral-actions";

/** "Have a mentor's code?" — the visitor enters it; only then do prices show the mentor price. */
export function ReferralBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="self-start text-[12.5px] font-semibold text-oxblood underline">Have a mentor&apos;s referral code?</button>;
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true); setErr(null);
        const r = await applyReferralAction(code);
        setBusy(false);
        if (r.ok) router.refresh(); else setErr(r.error);
      }}
    >
      <input
        aria-label="Mentor referral code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" autoCapitalize="characters" autoComplete="off" maxLength={16}
        className="min-h-10 w-[170px] rounded-lg border border-line-strong bg-white px-3 text-base font-medium tracking-[0.08em] text-ink placeholder:tracking-normal placeholder:text-ink-faint md:text-[13px]"
      />
      <Button type="submit" size="sm" variant="dark" disabled={busy}>{busy ? "Checking…" : "See my price"}</Button>
      {err && <p role="alert" className="w-full text-xs text-oxblood">{err}</p>}
    </form>
  );
}
