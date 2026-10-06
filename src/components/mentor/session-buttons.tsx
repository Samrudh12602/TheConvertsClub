"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { noShowAction } from "@/app/mentor/actions";

export function NoShowButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button variant="quiet" disabled={pending} onClick={() => setOpen(true)}>{pending ? "…" : "Mark no-show"}</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} danger title="Mark as a no-show?" body="Their credit is used and the session closes." confirmLabel="Mark no-show" busy={pending}
        onConfirm={() => start(async () => { const r = await noShowAction(sessionId); setOpen(false); if (!r.ok) { setErr(r.error); toast.error(r.error); } else { toast.info("Marked as a no-show."); router.refresh(); } })} />
      {err && <p role="alert" className="mt-1 text-xs text-oxblood">{err}</p>}
    </div>
  );
}
