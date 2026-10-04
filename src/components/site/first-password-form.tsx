"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { firstPasswordAction, type FirstPasswordState } from "@/app/actions/auth";

export function FirstPasswordForm() {
  const [state, action, actionPending] = useActionState<FirstPasswordState, FormData>(firstPasswordAction, {});
  const [, start] = useTransition();
  return (
    // Submitted through a transition so a typo doesn't clear the fields the person just typed.
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(() => action(fd)); }} className="mt-5 flex flex-col gap-3" noValidate>
      <Field label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters. Pick something only you know." />
      <Field label="Confirm new password" name="confirmPassword" type="password" required autoComplete="new-password" />
      {state.error && <p role="alert" className="text-xs text-oxblood">{state.error}</p>}
      <Button type="submit" size="lg" disabled={actionPending} className="rounded-[9px]">{actionPending ? "Saving…" : "Save and continue"}</Button>
    </form>
  );
}
