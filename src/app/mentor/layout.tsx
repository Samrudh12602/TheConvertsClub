import type { Metadata } from "next";
import Link from "next/link";
import { PortalFrame } from "@/components/portal/portal-frame";
import { TopPill, UserChip } from "@/components/portal/user-chip";
import { db } from "@/lib/db";
import { firstName, fmtDay, relative } from "@/lib/format";
import { getSettings } from "@/lib/settings-db";
import { requireMentor } from "@/server/session";

export const metadata: Metadata = { title: { default: "Mentor portal", template: "%s · The Converts Club" }, robots: { index: false, follow: false } };

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, mentor } = await requireMentor();
  const settings = await getSettings();
  const due = await db.session.findMany({ where: { mentorId: mentor.id, status: "CONFIRMED", startsAt: { lt: new Date() }, feedback: null }, orderBy: { startsAt: "asc" }, select: { startsAt: true } });
  const soonest = due[0]?.startsAt ? new Date(due[0].startsAt.getTime() + settings.feedbackDueHours * 3_600_000) : null;

  return (
    <PortalFrame
      role="mentor"
      tier={mentor.tier}
      titleOverrides={{ "/mentor": { title: `Hi ${firstName(user.name)}`, sub: `${fmtDay(new Date())} · all times IST` } }}
      topRight={
        <>
          {user.role === "ADMIN" && <Link href="/admin" className="inline-flex items-center rounded-lg border border-line-strong bg-white px-2.5 py-[7px] text-[11.5px] font-semibold text-ink no-underline hover:border-ink hover:no-underline">← Admin console</Link>}
          {due.length > 0 && soonest && <TopPill tone="amber">{due.length} feedback due {relative(soonest)}</TopPill>}
          <UserChip name={user.name} userId={user.id} avatarKey={user.avatarKey} profileHref="/mentor/profile" />
        </>
      }
    >
      {children}
    </PortalFrame>
  );
}
