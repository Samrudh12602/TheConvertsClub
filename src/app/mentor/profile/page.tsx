import { Panel } from "@/components/portal/ui";
import { PortalPage } from "@/components/portal/portal-page";
import { SetPasswordForm } from "@/components/portal/set-password-form";
import { ProfileForm } from "@/components/mentor/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { BasicsForm } from "@/components/profile/basics-form";
import { DocumentsPanel, type DocRow } from "@/components/profile/documents-panel";
import { MentorAboutForm } from "@/components/profile/mentor-about-form";
import { CouponCodeForm } from "@/components/mentor/coupon-code-form";
import { db } from "@/lib/db";
import { decryptJson } from "@/server/crypto";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

function mask(enc: string | null): string {
  if (!enc) return "not set";
  try {
    const p = decryptJson<{ upi?: string; accountNumber?: string }>(enc);
    if (p.upi) return `UPI ••••${p.upi.slice(Math.max(0, p.upi.indexOf("@")))}`;
    if (p.accountNumber) return `Account ••••${p.accountNumber.slice(-4)}`;
  } catch { /* unreadable */ }
  return "on file";
}

export default async function Profile() {
  const { user, mentor } = await requireMentor();
  const coupon = await db.coupon.findUnique({ where: { mentorId: mentor.id } });
  const docs = await db.profileDocument.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const rows: DocRow[] = docs.map((d) => ({ id: d.id, kind: d.kind, title: d.title, year: d.year, score: d.score, note: d.note, fileName: d.fileName, hasFile: Boolean(d.fileKey) }));
  const referrals = coupon ? await db.order.count({ where: { couponId: coupon.id, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } }) : 0;
  return (
    <PortalPage>
      <section className="max-w-[660px] rounded-2xl border border-line bg-card p-5 shadow-card">
        <AvatarUploader userId={user.id} name={user.name} avatarKey={user.avatarKey} />
        <p className="mt-3 text-[11.5px] leading-[1.5] text-ink-faint">This photo is for your portal. The photo on the public mentors page is set by Samrudh.</p>
      </section>
      <div className="max-w-[660px]"><BasicsForm name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} nameLocked /></div>
      <dl className="grid max-w-[660px] gap-3 rounded-[10px] border border-line bg-card p-4 text-[13px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {[["Name", user.name?.replace(/\s*\(demo\)/, "")], ["College and batch", `${mentor.college ?? "—"}${mentor.batchYear ? `, ${mentor.batchYear}` : ""}`], ["Tier", `${mentor.tier} · set by Samrudh, never shown to students`], ["Email", user.email]].map(([k, v]) => <div key={k}><dt className="type-label text-ink-faint">{k}</dt><dd className="mt-1 text-ink-body">{v}</dd></div>)}
      </dl>
      {coupon && (
        <Panel title="Your referral code" flush={false}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="tnum font-display text-xl font-bold tracking-[0.08em] text-ink">{coupon.code}</p>
              <p className="mt-1.5 max-w-[46ch] text-[12.5px] leading-[1.5] text-ink-faint">Give this to a student — they enter it at checkout for {coupon.type === "PERCENT" ? `${coupon.value}% off` : "a discount"} on any purchase.</p>
              <CouponCodeForm code={coupon.code} />
            </div>
            <div className="rounded-[10px] bg-ink px-4 py-3 text-center">
              <p className="tnum font-display text-2xl font-bold leading-none text-surface">{referrals}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-dark-muted">{referrals === 1 ? "student" : "students"} used it</p>
            </div>
          </div>
        </Panel>
      )}
      <Panel title="About your conversion" flush={false}><MentorAboutForm initial={{ convertedInstitutes: mentor.convertedInstitutes.join(", "), examScores: mentor.examScores ?? "", company: mentor.company ?? "", jobRole: mentor.jobRole ?? "" }} /></Panel>
      <Panel title="Proof: call letters, admit letters and scores" flush={false}>
        <p className="mb-3 text-[12.5px] leading-[1.6] text-ink-muted">Add your admit letters and exam results. Only you and the admin team can open them; they help us verify you converted.</p>
        <DocumentsPanel docs={rows} kinds={["ADMIT_LETTER", "CALL_LETTER", "EXAM_RESULT", "OTHER"]} defaultKind="ADMIT_LETTER" />
      </Panel>
      <ProfileForm initial={{ bio: mentor.bio ?? "", meetingUrl: mentor.meetingUrl ?? "", status: mentor.status === "PAUSED" ? "PAUSED" : "ACTIVE" }} payoutMasked={mask(mentor.payoutEncrypted)} />
      <Panel title={user.passwordHash ? "Change password" : "Set a password"} flush={false}>
        <SetPasswordForm hasPassword={Boolean(user.passwordHash)} />
      </Panel>
    </PortalPage>
  );
}
