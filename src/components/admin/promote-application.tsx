"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { promoteApplicationAction } from "@/app/admin/actions";

export function PromoteButton({ applicationId, defaultTier }: { applicationId: string; defaultTier: "JUNIOR" | "SENIOR" }) {
  const router = useRouter();
  const [tier, setTier] = useState(defaultTier);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <select value={tier} onChange={(e) => setTier(e.target.value as "JUNIOR" | "SENIOR")} className="min-h-9 rounded-lg border border-line-strong bg-white px-2 text-xs">
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
        <Button size="sm" disabled={pending} onClick={() => { if (!confirm("Create a mentor account for this applicant and email them a login link?")) return; start(async () => { setErr(null); const r = await promoteApplicationAction(applicationId, tier); if (!r.ok) setErr(r.error); else router.refresh(); }); }}>
          {pending ? "…" : "Promote to mentor"}
        </Button>
      </div>
      {err && <p role="alert" className="max-w-[220px] text-right text-[11px] leading-[1.3] text-oxblood">{err}</p>}
    </div>
  );
}
