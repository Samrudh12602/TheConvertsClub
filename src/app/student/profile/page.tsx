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

export default async function StudentProfilePage() {
  const user = await requireStudent();
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
    </PortalPage>
  );
}
