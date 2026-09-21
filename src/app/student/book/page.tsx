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

export default async function BookPage({ searchParams }: { searchParams: Promise<{ reschedule?: string }> }) {
  const user = await requireStudent();
  const { reschedule: rid } = await searchParams;
  const [bal, guidance] = await Promise.all([getBalances(db, user.id), getProduct("quick-guidance")]);
  const credits = Object.fromEntries(Object.entries(bal).map(([k, v]) => [k, v?.available ?? 0]));

  let reschedule;
  if (rid) {
    const s = await db.session.findUnique({ where: { id: rid } });
    if (!s || s.studentId !== user.id || !s.startsAt || !["CONFIRMED", "REQUESTED"].includes(s.status) || s.type === "GD_BATCH") notFound();
    reschedule = { sessionId: s.id, type: s.type, focus: s.focus, label: `${sessionTitle(s.type, s.focus)} (${fmtWhen(s.startsAt)})` };
  }
  return (
    <PortalPage>
      <BookFlow credits={credits} guidancePrice={guidance ? formatPaise(guidance.pricePaise) : "₹299"} reschedule={reschedule} />
    </PortalPage>
  );
}
