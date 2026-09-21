import type { Metadata } from "next";
import { nowMs } from "@/lib/datetime";
import { PortalFrame } from "@/components/portal/portal-frame";
import { TopPill, UserChip } from "@/components/portal/user-chip";
import { db } from "@/lib/db";
import { firstName, fmtFull } from "@/lib/format";
import { CREDIT_LABEL } from "@/lib/labels";
import { getBalances } from "@/server/credits";
import { requireStudent } from "@/server/session";

export const metadata: Metadata = { title: { default: "Student portal", template: "%s · The Convert Club" }, robots: { index: false, follow: false } };

const ORDER = ["PI", "GD", "WAT", "SOP_DETAILED", "SOP_BASIC", "SOP_REVISION", "STRATEGY", "GUIDANCE"] as const;

/** "IIM Ahmedabad" -> "IIM A"; "XLRI Jamshedpur" -> "XLRI". */
const shortName = (s: string) => (/^IIM\s+\w/i.test(s) ? `IIM ${s.split(/\s+/)[1][0].toUpperCase()}` : s.split(/\s+/)[0]);

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const [balances, nextCall] = await Promise.all([
    getBalances(db, user.id),
    db.callTracker.findFirst({ where: { studentId: user.id, outcome: "SCHEDULED", interviewDate: { gt: new Date() } }, orderBy: { interviewDate: "asc" } }),
  ]);
  const credits = ORDER.filter((k) => (balances[k]?.available ?? 0) > 0).map((k) => `${balances[k]!.available} ${CREDIT_LABEL[k]}`);
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
