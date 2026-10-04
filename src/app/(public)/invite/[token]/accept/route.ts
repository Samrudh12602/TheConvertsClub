import { NextResponse, type NextRequest } from "next/server";
import { auth, refreshSession } from "@/auth";
import { db } from "@/lib/db";
import { sha256 } from "@/server/crypto";
import { audit } from "@/server/audit";
import { createMentorCoupon } from "@/server/mentor-coupon";

/** Accepting an invite requires being signed in as the invited email. Sets role MENTOR and creates the profile. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url));

  const session = await auth();
  if (!session?.user?.id) return back(`/invite/${token}`);

  const invite = await db.mentorInvite.findUnique({ where: { tokenHash: sha256(token) } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return back(`/invite/${token}`);

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) return back(`/invite/${token}`);

  await db.$transaction(async (tx) => {
    // A mentor who arrives by invite has no password yet, so their first screen is "choose your password".
    if (user.role !== "ADMIN") await tx.user.update({ where: { id: user.id }, data: { role: "MENTOR", ...(user.passwordHash ? {} : { mustChangePassword: true }) } });
    const isAdminMentor = user.role === "ADMIN";
    const existingProfile = await tx.mentorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    const mentor = await tx.mentorProfile.upsert({
      where: { userId: user.id },
      update: { tier: invite.tier, status: "ACTIVE" },
      create: { userId: user.id, tier: invite.tier, status: "ACTIVE", isAdminMentor },
    });
    // Only a brand-new, real (non-admin-mode) mentor profile gets a referral code — never on a
    // re-accept, and admin's own mentor mode has nothing to refer.
    if (!existingProfile && !isAdminMentor) await createMentorCoupon(tx, mentor.id, user.name ?? user.email);
    await tx.mentorInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  });
  await audit({ actorId: user.id, action: "mentor.invite_accepted", entity: "MentorInvite", entityId: invite.id });
  // Role changed: refresh the session token now so the proxy sees MENTOR immediately.
  await refreshSession({});
  return back("/go");
}
