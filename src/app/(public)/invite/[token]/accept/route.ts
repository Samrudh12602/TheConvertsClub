import { NextResponse, type NextRequest } from "next/server";
import { auth, refreshSession } from "@/auth";
import { db } from "@/lib/db";
import { sha256 } from "@/server/crypto";
import { audit } from "@/server/audit";

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
    if (user.role !== "ADMIN") await tx.user.update({ where: { id: user.id }, data: { role: "MENTOR" } });
    await tx.mentorProfile.upsert({
      where: { userId: user.id },
      update: { tier: invite.tier, status: "ACTIVE" },
      create: { userId: user.id, tier: invite.tier, status: "ACTIVE", isAdminMentor: user.role === "ADMIN" },
    });
    await tx.mentorInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  });
  await audit({ actorId: user.id, action: "mentor.invite_accepted", entity: "MentorInvite", entityId: invite.id });
  // Role changed: refresh the session token now so the proxy sees MENTOR immediately.
  await refreshSession({});
  return back("/go");
}
