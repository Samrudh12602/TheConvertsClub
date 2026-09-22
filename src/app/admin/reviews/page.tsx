import { PortalPage } from "@/components/portal/portal-page";
import { Empty, StatusPill } from "@/components/portal/ui";
import { ReviewAssignPicker } from "@/components/admin/review-assign";
import { db } from "@/lib/db";
import { relative } from "@/lib/format";
import { REVIEW_LABEL, REVIEW_STATUS } from "@/lib/labels";
import { serviceForReview } from "@/server/payroll";

export const dynamic = "force-dynamic";
export const metadata = { title: "WAT & SOP reviews" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function AdminReviews() {
  const reviews = await db.review.findMany({ where: { status: { not: "COMPLETED" } }, orderBy: { dueAt: "asc" }, include: { student: { select: { name: true } }, assignedMentor: { include: { user: { select: { name: true } } } } } });
  const mentorRows = await db.mentorProfile.findMany({ where: { status: "ACTIVE", isAdminMentor: false }, include: { user: { select: { name: true } } } });
  const rates = await db.payRate.findMany();
  const eligible = (kind: (typeof reviews)[number]["kind"]) => {
    const service = serviceForReview(kind);
    const tiers = new Set(rates.filter((r) => r.service === service).map((r) => r.tier));
    return mentorRows.filter((m) => tiers.has(m.tier)).map((m) => ({ id: m.id, label: nm(m.user.name) }));
  };

  return (
    <PortalPage width="max-w-[900px]">
      {reviews.length === 0 ? <Empty>Nothing waiting.</Empty> : reviews.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-card p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{nm(r.student.name)} · {REVIEW_LABEL[r.kind]}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-faint">{r.fileName ?? "Pasted text"} · due {relative(r.dueAt)}{r.assignedMentor ? ` · assigned to ${nm(r.assignedMentor.user.name)}` : ""}</p>
          </div>
          <StatusPill tone={REVIEW_STATUS[r.status].tone}>{REVIEW_STATUS[r.status].label}</StatusPill>
          <ReviewAssignPicker reviewId={r.id} options={eligible(r.kind)} currentId={r.assignedMentorId} />
        </div>
      ))}
    </PortalPage>
  );
}
