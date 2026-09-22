import { Panel } from "@/components/portal/ui";
import { PortalPage } from "@/components/portal/portal-page";
import { SetPasswordForm } from "@/components/portal/set-password-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings-db";
import { requireAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([requireAdmin(), getSettings()]);
  return (
    <PortalPage>
      <SettingsForm initial={settings} />
      <Panel title={user.passwordHash ? "Change your password" : "Set a password"} flush={false}>
        <SetPasswordForm hasPassword={Boolean(user.passwordHash)} />
      </Panel>
    </PortalPage>
  );
}
