"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerifyEmailAction, type ResendState } from "@/app/(public)/verify-email/actions";

export function ResendVerifyForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ResendState, FormData>(resendVerifyEmailAction, {});
  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="secondary" size="lg" disabled={pending || state.sent} className="rounded-[9px]">
        {state.sent ? "New link sent" : pending ? "Sending…" : "Send a new link"}
      </Button>
      {state.error && <p role="alert" className="mt-2 text-xs text-oxblood">{state.error}</p>}
      {state.sent && <p role="status" className="mt-2 text-xs text-ink-faint">If that address has an account waiting on verification, a new link is on its way.</p>}
    </form>
  );
}
