import type { Metadata } from "next";
import { nowMs } from "@/lib/datetime";
import { PortalFrame } from "@/components/portal/portal-frame";
import { TopPill, UserChip } from "@/components/portal/user-chip";
import { db } from "@/lib/db";
import { firstName, fmtFull } from "@/lib/format";
import { CREDIT_KIND_ORDER, CREDIT_LABEL } from "@/lib/labels";
import { studentPortal } from "@/lib/portal-nav";
import { getCreditSummary } from "@/server/credits";
import { requireStudent } from "@/server/session";
import { NEW_STUDENT_NAV, lockedKeyFor, studentStage } from "@/server/student-kind";
import { gdpiComingSoon } from "@/server/site-mode";

export const metadata: Metadata = { title: { default: "Student portal", template: "%s · The Converts Club" }, robots: { index: false, follow: false } };

/** "IIM Ahmedabad" -> "IIM A"; "XLRI Jamshedpur" -> "XLRI". */
const shortName = (s: string) => (/^IIM\s+\w/i.test(s) ? `IIM ${s.split(/\s+/)[1][0].toUpperCase()}` : s.split(/\s+/)[0]);

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const [summary, nextCall] = await Promise.all([
    getCreditSummary(db, user.id),
    db.callTracker.findFirst({ where: { studentId: user.id, outcome: "SCHEDULED", interviewDate: { gt: new Date() } }, orderBy: { interviewDate: "asc" } }),
  ]);
  // Every kind stays separate here too — never a combined "X credits left" total.
  const credits = CREDIT_KIND_ORDER.filter((k) => (summary[k]?.available ?? 0) > 0 || (summary[k]?.reserved ?? 0) > 0).map((k) => {
    const s = summary[k]!;
    return `${s.available} ${CREDIT_LABEL[k]}${s.reserved > 0 ? ` (+${s.reserved} held)` : ""}`;
  });
  const days = nextCall?.interviewDate ? Math.ceil((nextCall.interviewDate.getTime() - nowMs()) / 86_400_000) : null;
  const onboarded = Boolean(user.studentProfile?.onboardedAt);
  const [stage, soon] = await Promise.all([studentStage(db, user.id), gdpiComingSoon()]);
  const navGroups = studentPortal.groups.map((g) => ({
    ...g,
    items:
      stage === "new"
        ? g.items.filter((i) => NEW_STUDENT_NAV.includes(i.href))
        : stage === "mocks"
          // Bought mocks only: the rest of the portal is listed but locked, so they can see what a plan adds.
          ? g.items.filter((i) => i.href !== "/student/onboarding").map((i) => { const k = lockedKeyFor(i.href); return k ? { ...i, href: `/student/locked/${k}`, iconHref: i.href, lock: soon ? ("soon" as const) : ("buy" as const) } : i; })
          : onboarded ? g.items.filter((i) => i.href !== "/student/onboarding") : g.items,
  }));

  return (
    <PortalFrame
      role="student"
      credits={credits}
      navGroups={navGroups}
      titleOverrides={{ "/student": { title: `Hi ${firstName(user.name)}`, sub: `${fmtFull(new Date())} · everything in IST` } }}
      topRight={
        <>
          {nextCall && days !== null && <TopPill>{shortName(nextCall.institute)} in {days} day{days === 1 ? "" : "s"}</TopPill>}
          <UserChip name={user.name} userId={user.id} avatarKey={user.avatarKey} profileHref="/student/profile" />
        </>
      }
    >
      {children}
    </PortalFrame>
  );
}
