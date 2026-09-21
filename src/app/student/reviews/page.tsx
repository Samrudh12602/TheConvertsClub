import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Insight, StatusPill } from "@/components/portal/ui";
import { ReviewUpload } from "@/components/student/review-upload";
import { db } from "@/lib/db";
import { fmtDate, relative } from "@/lib/format";
import { REVIEW_LABEL, REVIEW_STATUS, RUBRIC } from "@/lib/labels";
import { getBalances } from "@/server/credits";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "WAT & SOP" };
const lines = (s?: string | null) => (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export default async function ReviewsPage() {
  const user = await requireStudent();
  const [bal, reviews] = await Promise.all([getBalances(db, user.id), db.review.findMany({ where: { studentId: user.id }, orderBy: { submittedAt: "desc" }, include: { feedback: true } })]);
  const kinds = (["WAT", "SOP_DETAILED", "SOP_BASIC"] as const).filter((k) => (bal[k]?.available ?? 0) > 0);
  return (
    <PortalPage width="max-w-[820px]">
      <ReviewUpload kinds={kinds} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      {reviews.map((r) => {
        const st = REVIEW_STATUS[r.status];
        const f = r.feedback;
        const scores = (f?.scores ?? {}) as Record<string, number>;
        return (
          <div key={r.id} className="rounded-[10px] border border-line bg-card p-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[220px] flex-[1_1_220px]">
                <p className="text-[13.5px] font-semibold leading-[1.3] text-ink">{r.title ?? REVIEW_LABEL[r.kind]}</p>
                <p className="mt-[3px] text-xs leading-[1.4] text-ink-faint">{REVIEW_LABEL[r.kind]} · {r.fileName ?? "Pasted text"} · {fmtDate(r.submittedAt)}{r.status !== "COMPLETED" ? ` · due ${relative(r.dueAt)}` : ""}</p>
              </div>
              {r.fileKey && <Link href={`/api/files/${r.id}`} className="text-xs font-semibold">Download</Link>}
              <StatusPill tone={st.tone}>{st.label}</StatusPill>
            </div>
            {f && (
              <div className="mt-3.5 flex flex-col gap-3 border-t border-line-soft pt-3.5">
                <p className="text-[13px] text-ink-2">Overall <span className="tnum font-display text-lg font-bold text-ink">{f.overall.toFixed(1)}</span> · {RUBRIC.filter((x) => scores[x] !== undefined).map((x) => `${x} ${scores[x]}`).join(" · ")}</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  <Insight title="What worked" tone="green">{lines(f.strengths).map((l) => <p key={l}>{l}</p>)}</Insight>
                  <Insight title="What to fix" tone="oxblood">{lines(f.weaknesses).map((l) => <p key={l}>{l}</p>)}</Insight>
                  {f.answerFraming && <Insight title="Rewrite" tone="amber">{lines(f.answerFraming).map((l) => <p key={l}>{l}</p>)}</Insight>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </PortalPage>
  );
}
