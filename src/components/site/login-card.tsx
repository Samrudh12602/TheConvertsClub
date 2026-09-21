"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PendingNotice } from "@/components/ui/pending-notice";
import { loginEmailSchema, type LoginEmail } from "@/lib/validation/forms";

/** One login for students, mentors and admin. Auth.js wiring lands in Phase 1. */
export function LoginCard({ heading, sub }: { heading: string; sub: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginEmail>({ resolver: zodResolver(loginEmailSchema), mode: "onTouched" });

  return (
    <div className="rounded-[14px] border border-line bg-card p-7">
      <h1 className="font-display text-[21px] font-bold leading-[1.25] text-ink">{heading}</h1>
      <p className="mt-[7px] text-[13px] leading-[1.6] text-ink-faint">{sub}</p>

      <Button variant="secondary" size="lg" block className="mt-5 rounded-[9px] text-[13px] font-semibold" onClick={() => setPending("Google sign-in isn't connected in this environment yet.")}>
        Continue with Google
      </Button>

      <div className="my-[18px] flex items-center gap-[11px]" role="separator" aria-label="or">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium leading-none text-ink-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(() => setPending("Email login links aren't connected in this environment yet. Nothing was sent."))}
      >
        <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Button type="submit" size="lg" block className="mt-3 rounded-[9px] text-[13px]">
          Email me a login link
        </Button>
      </form>
      {pending && <PendingNotice>{pending}</PendingNotice>}
    </div>
  );
}
