import { Panel } from "@/components/portal/ui";
import { PortalPage } from "@/components/portal/portal-page";
import { SetPasswordForm } from "@/components/portal/set-password-form";
import { ProfileForm } from "@/components/mentor/profile-form";
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
  return (
    <PortalPage>
      <dl className="grid max-w-[660px] gap-3 rounded-[10px] border border-line bg-card p-4 text-[13px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {[["Name", user.name?.replace(/\s*\(demo\)/, "")], ["College and batch", `${mentor.college ?? "—"}${mentor.batchYear ? `, ${mentor.batchYear}` : ""}`], ["Tier", `${mentor.tier} · set by Samrudh, never shown to students`], ["Email", user.email]].map(([k, v]) => <div key={k}><dt className="type-label text-ink-faint">{k}</dt><dd className="mt-1 text-ink-body">{v}</dd></div>)}
      </dl>
      <ProfileForm initial={{ bio: mentor.bio ?? "", meetingUrl: mentor.meetingUrl ?? "", status: mentor.status === "PAUSED" ? "PAUSED" : "ACTIVE" }} payoutMasked={mask(mentor.payoutEncrypted)} />
      <Panel title={user.passwordHash ? "Change password" : "Set a password"} flush={false}>
        <SetPasswordForm hasPassword={Boolean(user.passwordHash)} />
      </Panel>
    </PortalPage>
  );
}
