"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { joinGdAction, leaveGdAction } from "@/app/student/actions";

export function GdButton({ batchId, mode, label }: { batchId: string; mode: "join" | "leave" | "waitlist"; label: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    setErr(null);
    const r = mode === "leave" ? await leaveGdAction(batchId) : await joinGdAction(batchId);
    setOpen(false);
    if (!r.ok) { setErr(r.error); toast.error(r.error); } else { toast.success(mode === "leave" ? "You've left the batch." : mode === "join" ? "You're in the batch." : "Added to the waitlist."); router.refresh(); }
  });
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={mode === "join" ? "dark" : "secondary"} disabled={pending}
        className={mode === "leave" ? "text-oxblood" : ""}
        onClick={() => (mode === "leave" ? setOpen(true) : run())}>{pending ? "…" : label}</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} danger title="Leave this batch?" body="Under the notice period your credit is used." confirmLabel="Leave batch" busy={pending} onConfirm={run} />
      {err && <p role="alert" className="max-w-[200px] text-right text-[11px] leading-[1.3] text-oxblood">{err}</p>}
    </div>
  );
}
