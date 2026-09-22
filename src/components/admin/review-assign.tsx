"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignReviewAction } from "@/app/admin/actions";

export function ReviewAssignPicker({ reviewId, options, currentId }: { reviewId: string; options: { id: string; label: string }[]; currentId?: string | null }) {
  const router = useRouter();
  const [val, setVal] = useState(currentId ?? options[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <select value={val} onChange={(e) => setVal(e.target.value)} className="min-h-9 rounded-lg border border-line-strong bg-white px-2 text-xs">{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
        <Button size="sm" disabled={pending} onClick={() => start(async () => { setErr(null); const r = await assignReviewAction(reviewId, val); if (!r.ok) setErr(r.error); else router.refresh(); })}>{pending ? "…" : currentId ? "Reassign" : "Assign"}</Button>
      </div>
      {err && <p role="alert" className="text-[11px] text-oxblood">{err}</p>}
    </div>
  );
}
