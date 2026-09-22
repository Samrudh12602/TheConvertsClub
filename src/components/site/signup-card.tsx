"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signupAction, type SignupState } from "@/app/(public)/signup/actions";

export function SignupCard({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signupAction, {});
  return (
    <div className="rounded-[14px] border border-line bg-card p-7">
      <h1 className="font-display text-[21px] font-bold leading-[1.25] text-ink">Create your account</h1>
      <p className="mt-[7px] text-[13px] leading-[1.6] text-ink-faint">
        For students. Mentors join by invite or by applying — see{" "}
        <Link href="/become-a-mentor">Become a mentor</Link>.
      </p>
      <form action={action} className="mt-5 flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Full name" name="name" required autoComplete="name" placeholder="Your full name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
        <Field label="Confirm password" name="confirmPassword" type="password" required autoComplete="new-password" />
        {state.error && (
          <p role="alert" className="text-xs text-oxblood">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" block disabled={pending} className="mt-1 rounded-[9px] text-[13px]">
          {pending ? "Creating your account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-xs leading-[1.5] text-ink-faint">
        Already have an account? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Log in</Link>
      </p>
    </div>
  );
}
