import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { cronGuard } from "@/server/cron-auth";
import { sendMentorCredentials } from "@/server/mentors";

export const runtime = "nodejs";

/**
 * Operator route (same secret as the cron jobs): emails one real mentor a fresh temporary password and a
 * login button. Used by the "Resend mentor login" GitHub workflow so it can be done without opening the
 * admin portal. Refuses demo accounts. Replaces the mentor's current password, like the admin button does.
 */
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  const mentorId = req.nextUrl.searchParams.get("mentorId") ?? "";
  const m = mentorId ? await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } }) : null;
  if (!m || m.user.isDemo) return NextResponse.json({ error: "No such real mentor" }, { status: 404 });
  const status = await sendMentorCredentials(m.userId, m.user.email);
  await audit({ actorId: null, action: "mentor.login_resent", entity: "MentorProfile", entityId: m.id, after: { status, via: "ops-route" } });
  return NextResponse.json({ ok: status === "SENT", status }, { status: status === "SENT" ? 200 : 502 });
}
