import { Panel, StatusPill } from "@/components/portal/ui";
import { googleEnabled } from "@/auth";
import { appUrl } from "@/lib/env";
import { demoEnabled } from "@/server/demo";
import { emailProvider } from "@/server/email";
import { paymentsConfigured } from "@/server/razorpay";

/** What's actually live right now, at a glance — not what was meant to be configured. Every check
 * reads the same functions the real checkout/email code paths use, so this can't drift from reality. */
export async function SystemStatus() {
  const provider = emailProvider();
  const demo = await demoEnabled();
  const rows: { label: string; ok: boolean; detail: string }[] = [
    { label: "Payments (Razorpay)", ok: paymentsConfigured(), detail: paymentsConfigured() ? "Key configured — checkout will charge real Razorpay orders" : "No Razorpay key set — checkout is disabled" },
    { label: "Payment webhook", ok: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), detail: process.env.RAZORPAY_WEBHOOK_SECRET ? "Webhook secret set" : "No webhook secret — payment confirmation relies on the browser callback only" },
    { label: "Email sending", ok: provider !== null, detail: provider === "gmail" ? `Gmail — ${process.env.GMAIL_USER}` : provider === "resend" ? "Resend" : "No provider — emails are logged but never sent" },
    { label: "Google sign-in", ok: googleEnabled(), detail: googleEnabled() ? "Enabled" : "Not configured — students/mentors use password or demo login" },
    { label: "Live URL", ok: true, detail: appUrl() },
  ];
  return (
    <Panel title="System status" flush={false}>
      {demo && <p className="mb-3 rounded-lg bg-amber-tint px-3 py-2 text-xs font-medium text-amber-ink">Demo mode is ON (change it in Settings) — demo accounts and placeholder content are visible.</p>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 rounded-lg border border-line-soft px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink">{r.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-ink-faint">{r.detail}</p>
            </div>
            <StatusPill tone={r.ok ? "green" : "oxblood"}>{r.ok ? "Live" : "Off"}</StatusPill>
          </div>
        ))}
      </div>
    </Panel>
  );
}
