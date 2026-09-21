import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, emailLoginEnabled, googleEnabled } from "@/auth";
import { LoginCard } from "@/components/site/login-card";
import { DEMO_ACCOUNTS, roleHome, safeNext } from "@/lib/roles";
import { demoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) redirect(safeNext(sp.next) ?? roleHome(session.user.role));

  return (
    <div className="mx-auto max-w-[420px] px-5 py-12">
      <LoginCard
        heading="Log in"
        sub="Students, mentors and admin all use this page. We'll take you to the right place."
        next={safeNext(sp.next) ?? undefined}
        googleEnabled={googleEnabled()}
        emailEnabled={emailLoginEnabled()}
        demoAccounts={demoMode() ? DEMO_ACCOUNTS.map((a) => ({ role: a.role, email: a.email })) : undefined}
        notice={sp.sent ? "sent" : sp.error ? "error" : null}
      />
    </div>
  );
}
