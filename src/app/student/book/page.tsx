import { guardGdpi } from "@/server/gdpi-guard";
import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { BookFlow } from "@/components/student/book-flow";
import { db } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";
import { fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { getBalances } from "@/server/credits";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book a session" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ reschedule?: string; mentor?: string; type?: string; focus?: string }> }) {
  await guardGdpi("book");
  const user = await requireStudent();
  const { reschedule: rid, mentor: mentorParam, type: typeParam, focus: focusParam } = await searchParams;
  const [bal, guidance] = await Promise.all([getBalances(db, user.id), getProduct("quick-guidance")]);
  const credits = Object.fromEntries(Object.entries(bal).map(([k, v]) => [k, v?.available ?? 0]));

  let reschedule;
  if (rid) {
    const s = await db.session.findUnique({ where: { id: rid } });
    if (!s || s.studentId !== user.id || !s.startsAt || !["CONFIRMED", "REQUESTED"].includes(s.status) || s.type === "GD_BATCH") notFound();
    reschedule = { sessionId: s.id, type: s.type, focus: s.focus, label: `${sessionTitle(s.type, s.focus)} (${fmtWhen(s.startsAt)})` };
  }
  // "Book them again": only for a mentor this student has already finished a session with.
  let rebook: { mentorId: string; name: string } | undefined;
  if (mentorParam && !rid) {
    const met = await db.session.findFirst({ where: { studentId: user.id, mentorId: mentorParam, status: "COMPLETED" }, include: { mentor: { include: { user: { select: { name: true } } } } } });
    if (met?.mentor) rebook = { mentorId: met.mentor.id, name: (met.mentor.user.name ?? "your mentor").replace(/\s*\(demo\)/, "") };
  }
  const initialType = ["MOCK_PI", "GUIDANCE", "STRATEGY_CALL"].includes(typeParam ?? "") ? typeParam : undefined;
  const initialFocus = ["HR_PROFILE", "ACADEMICS", "STRESS", "INSTITUTE_FINAL", "CURRENT_AFFAIRS", "CROSS_QUESTIONING"].includes(focusParam ?? "") ? focusParam : undefined;
  return (
    <PortalPage>
      <BookFlow credits={credits} guidancePrice={guidance ? formatPaise(guidance.pricePaise) : "₹299"} reschedule={reschedule} rebook={rebook} initialType={initialType} initialFocus={initialFocus} />
    </PortalPage>
  );
}
