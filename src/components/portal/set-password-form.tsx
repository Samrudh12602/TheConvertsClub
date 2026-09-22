"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { setPasswordAction, type SetPasswordResult } from "@/app/actions/auth";

/** Lets any signed-in user (student, mentor, admin) add or change a password, so they can log in
 * with email + password next time instead of only Google or a magic link. */
export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState<SetPasswordResult | null, FormData>(setPasswordAction, null);
  return (
    <form action={action} className="flex max-w-[360px] flex-col gap-3">
      <Field label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
      <Field label="Confirm password" name="confirmPassword" type="password" required autoComplete="new-password" />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </Button>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={`text-xs ${state.ok ? "text-green" : "text-oxblood"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
