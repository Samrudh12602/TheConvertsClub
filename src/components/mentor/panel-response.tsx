"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { respondPanelAction } from "@/app/mentor/actions";

/** Accept or decline an invite to sit on a Panel PI. */
export function PanelResponse({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const answer = (accept: boolean) => start(async () => {
    const r = await respondPanelAction(sessionId, accept);
    setAsk(false);
    if (r.ok) { toast.success(accept ? "You're on the panel." : "Declined. The owner has been told."); router.refresh(); } else toast.error(r.error);
  });
  return (
    <div className="flex flex-wrap gap-2.5">
      <Button disabled={pending} onClick={() => answer(true)}><Check className="size-4" aria-hidden />Accept</Button>
      <Button variant="secondary" disabled={pending} onClick={() => setAsk(true)}><X className="size-4" aria-hidden />Decline</Button>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} danger title="Decline this panel?" body="Your held hour is released and the owner is told to pick another panelist." confirmLabel="Decline" busy={pending} onConfirm={() => answer(false)} />
    </div>
  );
}
