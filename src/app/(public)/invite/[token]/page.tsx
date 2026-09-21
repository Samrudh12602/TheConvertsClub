import type { Metadata } from "next";
import { LoginCard } from "@/components/site/login-card";

export const metadata: Metadata = { title: "Mentor invite", robots: { index: false, follow: false } };

/**
 * Not drawn in the design: reuses the login card with a mentor-specific heading (per the handoff screen map).
 * Phase 1 validates the token server-side and never reveals whether a token exists; the token is not echoed.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  await params;
  return (
    <div className="mx-auto max-w-[420px] px-5 py-12">
      <LoginCard heading="You've been invited to mentor" sub="Sign in with the email address the invite was sent to and we'll set up your mentor portal." />
    </div>
  );
}
