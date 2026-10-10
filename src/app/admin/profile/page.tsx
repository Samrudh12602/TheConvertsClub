import { PortalPage } from "@/components/portal/portal-page";
import { Panel } from "@/components/portal/ui";
import { SetPasswordForm } from "@/components/portal/set-password-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { BasicsForm } from "@/components/profile/basics-form";
import { requireAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile" };

export default async function AdminProfilePage() {
  const user = await requireAdmin();
  return (
    <PortalPage width="max-w-[720px]">
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card"><AvatarUploader userId={user.id} name={user.name} avatarKey={user.avatarKey} /></section>
      <BasicsForm name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} />
      <Panel title={user.passwordHash ? "Change password" : "Set a password"} flush={false}><SetPasswordForm hasPassword={Boolean(user.passwordHash)} /></Panel>
    </PortalPage>
  );
}
