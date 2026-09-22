"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setApplicationStageAction } from "@/app/admin/actions";

const STAGES = ["NEW", "SCREENING", "TRIAL_MOCK", "OFFER", "ACCEPTED", "REJECTED"];

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} defaultValue={stage} onChange={(e) => start(async () => { await setApplicationStageAction(id, e.target.value); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
      {STAGES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
    </select>
  );
}
