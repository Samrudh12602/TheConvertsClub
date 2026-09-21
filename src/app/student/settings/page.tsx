import { PortalPage } from "@/components/portal/portal-page";
import { DeletionRequest } from "@/components/student/deletion-request";
import { getSettings } from "@/lib/settings-db";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireStudent();
  const s = await getSettings();
  const phone = user.phone ? `${user.phone.slice(0, 2)}••• ••${user.phone.slice(-3)}` : "Not set";
  const rows: { label: string; hint: string; value: React.ReactNode }[] = [
    { label: "Email", hint: "Used for login and all reminders", value: user.email },
    { label: "Phone", hint: "Reminders 1 hour before a session", value: phone },
    { label: "Reminders", hint: `${s.cancelNoticeHours * 2} hours and 1 hour before each session`.replace(`${s.cancelNoticeHours * 2}`, "24"), value: "Both on" },
    { label: "Timezone", hint: "All times shown in this zone", value: "Asia/Kolkata" },
    { label: "Download my data", hint: "Profile, sessions, feedback, uploads", value: <a href="/api/account/export" className="rounded-lg border border-line-strong px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">Download</a> },
    { label: "Delete my account", hint: "Removes uploads within 30 days", value: <DeletionRequest /> },
  ];
  return (
    <PortalPage width="max-w-[660px]">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-card px-4 py-3.5">
          <div className="min-w-0"><p className="text-[13px] font-medium leading-[1.3] text-ink-body">{r.label}</p><p className="mt-[3px] text-[11.5px] leading-[1.4] text-ink-faint">{r.hint}</p></div>
          <div className="whitespace-nowrap rounded-[7px] bg-line-soft px-[11px] py-2 text-[12.5px] font-semibold leading-none text-ink">{r.value}</div>
        </div>
      ))}
    </PortalPage>
  );
}
