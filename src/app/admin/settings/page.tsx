import { PortalPage } from "@/components/portal/portal-page";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <PortalPage>
      <SettingsForm initial={settings} />
    </PortalPage>
  );
}
