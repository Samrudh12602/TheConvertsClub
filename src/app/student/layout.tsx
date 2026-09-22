import type { Metadata } from "next";
import { nowMs } from "@/lib/datetime";
import { PortalFrame } from "@/components/portal/portal-frame";
import { TopPill, UserChip } from "@/components/portal/user-chip";
import { db } from "@/lib/db";
import { firstName, fmtFull } from "@/lib/format";
import { CREDIT_KIND_ORDER, CREDIT_LABEL } from "@/lib/labels";
import { getCreditSummary } from "@/server/credits";
import { requireStudent } from "@/server/session";

export const metadata: Metadata = { title: { default: "Student portal", template: "%s · The Convert Club" }, robots: { index: false, follow: false } };

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

  return (
    <PortalFrame
      role="student"
      credits={credits}
      titleOverrides={{ "/student": { title: `Hi ${firstName(user.name)}`, sub: `${fmtFull(new Date())} · everything in IST` } }}
      topRight={
        <>
          {nextCall && days !== null && <TopPill>{shortName(nextCall.institute)} in {days} day{days === 1 ? "" : "s"}</TopPill>}
          <UserChip name={user.name} />
        </>
      }
    >
      {children}
    </PortalFrame>
  );
}
