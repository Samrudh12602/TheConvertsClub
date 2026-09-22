"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { demoSignIn, emailSignIn, googleSignIn, passwordSignIn, type LoginState } from "@/app/(public)/login/actions";

interface Props {
  heading: string;
  sub: string;
  next?: string;
  googleEnabled: boolean;
  emailEnabled: boolean;
  demoAccounts?: { role: string; email: string }[];
  notice?: "sent" | "error" | null;
}

/** One login for students, mentors and admin. We route to the right portal after sign-in.
 * Email + password works unconditionally (no external service needed); Google and the magic-link
 * option only appear once those are configured. */
export function LoginCard({ heading, sub, next, googleEnabled, emailEnabled, demoAccounts, notice }: Props) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(passwordSignIn, {});
  const [emailState, emailAction, emailPending] = useActionState<LoginState, FormData>(emailSignIn, {});
  const [demoState, demoAction, demoPending] = useActionState<LoginState, FormData>(demoSignIn, {});

  return (
    <div className="rounded-[14px] border border-line bg-card p-7">
      <h1 className="font-display text-[21px] font-bold leading-[1.25] text-ink">{heading}</h1>
      <p className="mt-[7px] text-[13px] leading-[1.6] text-ink-faint">{sub}</p>

      {notice === "sent" && <Notice tone="green" role="status" className="mt-4">Check your inbox. We&apos;ve sent a login link that works once and expires in 24 hours.</Notice>}
      {notice === "error" && <Notice tone="oxblood" role="alert" className="mt-4">That sign-in didn&apos;t work. Try again, or use a different method.</Notice>}

      {googleEnabled && (
        <form action={googleSignIn} className="mt-5">
          <input type="hidden" name="next" value={next ?? ""} />
          <Button type="submit" variant="secondary" size="lg" block className="rounded-[9px] text-[13px] font-semibold">
            Continue with Google
          </Button>
        </form>
      )}

      {googleEnabled && (
        <div className="my-[18px] flex items-center gap-[11px]" role="separator" aria-label="or">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-medium leading-none text-ink-faint">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>
      )}

      {mode === "password" ? (
        <form action={pwAction} className={googleEnabled ? "" : "mt-5"}>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="flex flex-col gap-3">
            <Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {pwState.error && (
            <p role="alert" className="mt-2 text-xs text-oxblood">
              {pwState.error}
            </p>
          )}
          <Button type="submit" size="lg" block disabled={pwPending} className="mt-3 rounded-[9px] text-[13px]">
            {pwPending ? "Signing in…" : "Log in"}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            New here? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Create an account</Link>
            {emailEnabled && (
              <>
                {" "}
                · <button type="button" onClick={() => setMode("link")} className="text-oxblood underline">No password? Email me a link</button>
              </>
            )}
          </p>
        </form>
      ) : emailEnabled ? (
        <form action={emailAction} className={googleEnabled ? "" : "mt-5"}>
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" error={emailState.error} />
          <Button type="submit" size="lg" block disabled={emailPending} className="mt-3 rounded-[9px] text-[13px]">
            {emailPending ? "Sending…" : "Email me a login link"}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            <button type="button" onClick={() => setMode("password")} className="text-oxblood underline">Use a password instead</button>
          </p>
        </form>
      ) : null}

      {demoAccounts && demoAccounts.length > 0 && (
        <form action={demoAction} className="mt-6 border-t border-line pt-5" aria-label="Demo access">
          <p className="type-label text-oxblood">Demo access</p>
          <p className="mt-1.5 text-xs leading-[1.5] text-ink-faint">Pre-filled test accounts with fake data. Ask Samrudh for the passcodes.</p>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label htmlFor="demo-email" className="type-label mb-1.5 block text-ink-faint">Account</label>
              <select id="demo-email" name="email" className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]">
                {demoAccounts.map((a) => (
                  <option key={a.email} value={a.email}>{a.role.charAt(0) + a.role.slice(1).toLowerCase()} · {a.email}</option>
                ))}
              </select>
            </div>
            <Field label="Passcode" name="passcode" type="password" required autoComplete="off" error={demoState.error} />
            <Button type="submit" variant="dark" size="lg" block disabled={demoPending} className="rounded-[9px] text-[13px]">
              {demoPending ? "Signing in…" : "Sign in to demo"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
