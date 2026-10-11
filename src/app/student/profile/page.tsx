import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Panel } from "@/components/portal/ui";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { BasicsForm } from "@/components/profile/basics-form";
import { DocumentsPanel, type DocRow } from "@/components/profile/documents-panel";
import { StudentBackgroundForm, type StudentBackgroundValues } from "@/components/profile/student-background-form";
import { db } from "@/lib/db";
import { studentCompleteness } from "@/lib/profile";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile" };

const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export default async function StudentProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireStudent();
  const welcome = (await searchParams).welcome === "1";
  const [p, docs] = await Promise.all([db.studentProfile.findUnique({ where: { userId: user.id } }), db.profileDocument.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })]);
  const { pct, missing } = studentCompleteness(p, docs.length, Boolean(user.avatarKey));
  const initial: StudentBackgroundValues = {
    dob: p?.dob ? p.dob.toISOString().slice(0, 10) : "", state: s(p?.state), city: s(p?.city), examsAppearing: p?.examsAppearing ?? [],
    tenthBoard: s(p?.tenthBoard), tenthPercent: s(p?.tenthPercent), tenthYear: s(p?.tenthYear), twelfthBoard: s(p?.twelfthBoard), twelfthStream: s(p?.twelfthStream), twelfthPercent: s(p?.twelfthPercent), twelfthYear: s(p?.twelfthYear),
    college: s(p?.college), degree: s(p?.degree), gradYear: s(p?.gradYear), gradScore: s(p?.gradScore), workExMonths: s(p?.workExMonths), company: s(p?.company), jobRole: s(p?.jobRole), industry: s(p?.industry), about: s(p?.about),
  };
  const rows: DocRow[] = docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, year: d.year, score: d.score, note: d.note, fileName: d.fileName, hasFile: Boolean(d.fileKey) }));
  return (
    <PortalPage width="max-w-[760px]">
      {welcome && (
        <section className="rounded-2xl border border-oxblood-line bg-gradient-to-br from-oxblood-tint to-white p-5 shadow-card" aria-label="Welcome">
          <p className="type-eyebrow text-oxblood">Welcome to The Converts Club</p>
          <h2 className="mt-1.5 font-display text-[21px] font-bold leading-[1.25] text-ink">{user.name ? `Hi ${user.name.split(" ")[0]}, tell us a little about you` : "Tell us a little about you"}</h2>
          <p className="mt-2 max-w-[60ch] text-[13px] leading-[1.65] text-ink-muted">Your details help us match your mocks and mentors to you. It takes about three minutes, every field is optional, and you can change it any time from your profile. Only you and our team can see it.</p>
          <Link href="/student" className="mt-3 inline-block text-[12.5px] font-semibold text-ink-muted underline">Skip for now, take me to my dashboard</Link>
        </section>
      )}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <AvatarUploader userId={user.id} name={user.name} avatarKey={user.avatarKey} />
          <div className="min-w-[220px] flex-1 sm:max-w-[320px]">
            <div className="flex items-baseline justify-between"><p className="text-[12.5px] font-semibold text-ink">Profile {pct}% complete</p></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><div className="h-full rounded-full bg-gradient-to-r from-oxblood to-gold transition-all" style={{ width: `${pct}%` }} /></div>
            {missing.length > 0 && <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">Still to add: {missing.slice(0, 3).join(", ")}{missing.length > 3 ? ` and ${missing.length - 3} more` : ""}.</p>}
          </div>
        </div>
      </section>

      <BasicsForm name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} />
      <StudentBackgroundForm initial={initial} />

      <Panel title="Exam results and call letters" flush={false}>
        <p className="mb-3 text-[12.5px] leading-[1.6] text-ink-muted">Add your CAT, XAT, NMAT, SNAP or other results, and any call or admit letters. A score alone is fine; a file (PDF, JPG or PNG) is optional. Only you and the admin team can see these.</p>
        <DocumentsPanel docs={rows} kinds={["EXAM_RESULT", "CALL_LETTER", "ADMIT_LETTER", "OTHER"]} defaultKind="EXAM_RESULT" />
      </Panel>
      {welcome && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
          <Link href="/student" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-[18px] text-[13px] font-semibold text-white no-underline shadow-glow hover:no-underline hover:brightness-110">Done, go to my dashboard →</Link>
          <p className="text-[12px] text-ink-faint">Save each section above first. You can finish the rest later.</p>
        </div>
      )}
    </PortalPage>
  );
}
