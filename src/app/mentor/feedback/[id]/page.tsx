import { notFound, redirect } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { FeedbackForm } from "@/components/mentor/feedback-form";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { REVIEW_LABEL, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getSettings } from "@/lib/settings-db";
import { serviceForReview, serviceForSession } from "@/server/payroll";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit feedback" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

/** `id` is a session or a review assigned to this mentor. */
export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { mentor } = await requireMentor();
  const { id } = await params;
  const settings = await getSettings();
  const session = await db.session.findUnique({ where: { id }, include: { student: { include: { studentProfile: true } }, feedback: true } });
  const review = session ? null : await db.review.findUnique({ where: { id }, include: { student: true, feedback: true } });
  const mine = session ? session.mentorId === mentor.id : review?.assignedMentorId === mentor.id;
  if (!mine || (!session && !review)) notFound();
  if ((session?.feedback ?? review?.feedback)) redirect(session ? `/mentor/sessions/${id}` : "/mentor/reviews");

  const service = session ? serviceForSession(session.type) : serviceForReview(review!.kind);
  const rate = service && !mentor.isAdminMentor ? (await db.payRate.findUnique({ where: { tier_service: { tier: mentor.tier, service } } }))?.amountPaise : null;
  const dueAt = session?.startsAt ? new Date(session.startsAt.getTime() + settings.feedbackDueHours * 3_600_000) : review?.dueAt;
  const title = session ? `${nm(session.student?.name)} · ${sessionTitle(session.type, session.focus)}` : `${nm(review!.student.name)} · ${REVIEW_LABEL[review!.kind]}`;

  return (
    <PortalPage width="max-w-[800px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-[17px] font-bold leading-[1.25] text-ink">{title}</h2>
          <p className="mt-1 text-[12.5px] leading-[1.45] text-ink-faint">{session?.startsAt ? fmtWhen(session.startsAt) : review ? `Submitted ${fmtWhen(review.submittedAt)}` : ""}</p>
          {review?.textBody && <details className="mt-2 text-[12.5px] text-ink-body"><summary className="cursor-pointer font-semibold text-oxblood">Read the submission</summary><p className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 leading-[1.6]">{review.textBody}</p></details>}
          {review?.fileKey && <a href={`/api/files/${review.id}`} className="mt-2 inline-block text-xs font-semibold">Download {review.fileName}</a>}
        </div>
        <div className="rounded-lg border border-amber-line bg-amber-tint px-[11px] py-2 text-[11.5px] font-semibold leading-none text-amber">{dueAt ? `Due ${relative(dueAt)}` : ""}{rate ? ` · ${formatPaise(rate)} accrues on submit` : ""}</div>
      </div>
      <FeedbackForm targetId={id} />
    </PortalPage>
  );
}
