import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, emailLoginEnabled, googleEnabled } from "@/auth";
import { LoginCard } from "@/components/site/login-card";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { sha256 } from "@/server/crypto";

export const metadata: Metadata = { title: "Mentor invite", robots: { index: false, follow: false } };

/**
 * Not drawn in the design: reuses the login card with a mentor heading (handoff screen map).
 * A bad, used or expired token gets one generic message so tokens can't be probed.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.mentorInvite.findUnique({ where: { tokenHash: sha256(token) } });
  const valid = invite && !invite.acceptedAt && invite.expiresAt > new Date();

  if (!valid) {
    return (
      <div className="mx-auto max-w-[420px] px-5 py-12">
        <Card className="p-7">
          <h1 className="font-display text-[21px] font-bold leading-[1.25] text-ink">This invite isn&apos;t valid</h1>
          <p className="mt-2 text-[13px] leading-[1.6] text-ink-faint">The link may have expired or already been used. Ask Samrudh to send a fresh one.</p>
        </Card>
      </div>
    );
  }

  const next = `/invite/${token}/accept`;
  if ((await auth())?.user) redirect(next);

  return (
    <div className="mx-auto max-w-[420px] px-5 py-12">
      <LoginCard
        heading="You've been invited to mentor"
        sub={`Sign in with ${invite.email} and we'll set up your mentor portal.`}
        next={next}
        googleEnabled={googleEnabled()}
        emailEnabled={emailLoginEnabled()}
      />
    </div>
  );
}
