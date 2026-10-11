"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { setReadAction, trashMailAction } from "@/app/admin/mailbox/actions";

export function MailActions({ folder, uid, backHref }: { folder: string; uid: number; backHref: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const forever = folder === "trash";
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after: () => void) =>
    start(async () => { const r = await fn(); if (r.ok) { toast.success(r.message ?? "Done."); after(); } else toast.error(r.error ?? "That didn't work."); });
  return (
    <>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title={forever ? "Delete for good?" : "Move to Trash?"} body={forever ? "This message will be permanently deleted." : "You can still find it in the Trash folder."} confirmLabel={forever ? "Delete" : "Move to Trash"} danger busy={pending} onConfirm={() => run(() => trashMailAction(folder, uid), () => { setAsk(false); router.push(backHref); })} />
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setReadAction(folder, uid, false), () => router.refresh())}><MailOpen className="size-4" aria-hidden /> Mark unread</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => setAsk(true)}><Trash2 className="size-4" aria-hidden /> {forever ? "Delete" : "Trash"}</Button>
    </>
  );
}
