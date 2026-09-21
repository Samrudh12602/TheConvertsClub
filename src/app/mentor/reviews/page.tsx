import Link from "next/link";
import { nowMs } from "@/lib/datetime";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, StatusPill } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { relative } from "@/lib/format";
import { REVIEW_LABEL } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { serviceForReview } from "@/server/payroll";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "WAT & SOP queue" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

export default async function MentorReviews() {
  const { mentor } = await requireMentor();
  const [rows, rates] = await Promise.all([
    db.review.findMany({ where: { assignedMentorId: mentor.id }, orderBy: [{ status: "asc" }, { dueAt: "asc" }], take: 60, include: { student: { select: { name: true } } } }),
    db.payRate.findMany({ where: { tier: mentor.tier } }),
  ]);
  const rate = (k: Parameters<typeof serviceForReview>[0]) => rates.find((r) => r.service === serviceForReview(k))?.amountPaise;
  return (
    <PortalPage>
      {rows.length === 0 ? <Empty>Nothing in your queue.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {rows.map((r) => {
            const done = r.status === "COMPLETED";
            const soon = r.dueAt.getTime() - nowMs() < 8 * 3_600_000;
            return (
              <div key={r.id} className="rounded-[11px] border border-line bg-card p-[15px]">
                <div className="flex items-start justify-between gap-2.5">
                  <div><p className="text-[13.5px] font-semibold leading-[1.3] text-ink">{nm(r.student.name)}</p><p className="mt-[3px] text-[11.5px] leading-[1.4] text-ink-faint">{REVIEW_LABEL[r.kind]} · {r.fileName ?? "Pasted text"}</p></div>
                  <StatusPill tone={done ? "stone" : soon ? "amber" : "green"}>{done ? "Submitted" : `Due ${relative(r.dueAt)}`}</StatusPill>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-line-soft pt-3">
                  <span className="text-[11.5px] font-medium text-ink-muted">{rate(r.kind) ? `${formatPaise(rate(r.kind)!)} ${done ? "accrued" : "on submit"}` : ""}</span>
                  {!done && <Link href={`/mentor/feedback/${r.id}`} className="inline-flex min-h-[38px] items-center rounded-[7px] border border-ink bg-ink px-[13px] text-[11.5px] font-semibold leading-none text-white no-underline hover:bg-ink-body hover:text-white hover:no-underline">Open</Link>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
}
