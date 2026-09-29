import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResendVerifyForm } from "@/components/site/resend-verify-form";
import { db } from "@/lib/db";
import { roleHome } from "@/lib/roles";
import { consumeVerifyEmailToken } from "@/server/auth-tokens";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="mx-auto max-w-[520px] px-5 py-14">
        <Card className="rounded-[14px] p-8 text-center">
          <h1 className="font-display text-xl font-bold leading-[1.3] text-ink">Missing verification link</h1>
          <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">Open the link from your email again, or log in and request a new one from settings.</p>
        </Card>
      </div>
    );
  }

  const ok = await consumeVerifyEmailToken(email, token);
  if (ok) {
    const user = await db.user.update({ where: { email: email.toLowerCase() }, data: { emailVerified: new Date() }, select: { role: true } }).catch(() => null);
    return (
      <div className="mx-auto max-w-[520px] px-5 py-14">
        <Card className="rounded-[14px] p-8 text-center">
          <h1 className="font-display text-xl font-bold leading-[1.3] text-ink">Email confirmed</h1>
          <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">{email} is verified. You&apos;re all set.</p>
          <ButtonLink href={user ? roleHome(user.role) : "/login"} size="lg" className="mt-5 rounded-[9px]">Continue</ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] px-5 py-14">
      <Card className="rounded-[14px] p-8 text-center">
        <h1 className="font-display text-xl font-bold leading-[1.3] text-ink">That link has expired</h1>
        <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">Verification links only work once and expire after 48 hours. Request a fresh one below.</p>
        <ResendVerifyForm email={email} />
      </Card>
    </div>
  );
}
