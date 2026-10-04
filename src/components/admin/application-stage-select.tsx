"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setApplicationStageAction } from "@/app/admin/actions";

// "Accepted" is deliberately not choosable: it is set automatically when you press "Approve as mentor",
// so the dropdown can never look like an approval that changes nothing.
const STAGES = ["NEW", "SCREENING", "TRIAL_MOCK", "OFFER", "REJECTED"];

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const options = STAGES.includes(stage) ? STAGES : [...STAGES, stage]; // keep a legacy value visible
  return (
    <div className="flex flex-col gap-1">
      <select aria-label="Application stage" disabled={pending} defaultValue={stage} onChange={(e) => start(async () => { setErr(null); const r = await setApplicationStageAction(id, e.target.value); if (!r.ok) setErr(r.error); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
        {options.map((s) => <option key={s} value={s}>{s === "ACCEPTED" ? "ACCEPTED (not yet approved)" : s.replace("_", " ")}</option>)}
      </select>
      {err && <p role="alert" className="max-w-[200px] text-[11px] leading-[1.3] text-oxblood">{err}</p>}
    </div>
  );
}
