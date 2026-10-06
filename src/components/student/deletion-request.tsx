"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { requestDeletionAction } from "@/app/student/actions";

export function DeletionRequest() {
  const [done, setDone] = useState(false);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <span className="text-xs font-medium text-green">Requested. We&apos;ll confirm by email.</span>;
  return (
    <>
      <Button size="sm" variant="quiet" disabled={pending} onClick={() => setOpen(true)}>{pending ? "…" : "Request"}</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} danger title="Delete your account and data?" body="Uploads are removed within 30 days. We'll confirm by email." confirmLabel="Request deletion" busy={pending}
        onConfirm={() => start(async () => { const r = await requestDeletionAction(); setOpen(false); if (r.ok) { setDone(true); toast.success("Deletion requested."); } else toast.error(r.error); })} />
    </>
  );
}
