import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section } from "@/components/portal/ui";
import { BroadcastForm } from "@/components/admin/broadcast-form";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/server/email-templates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communications" };

export default async function CommunicationsPage() {
  const rows = await db.emailLog.groupBy({ by: ["template"], _count: true });
  const sentByTemplate = await Promise.all(rows.map(async (r) => ({ template: r.template, total: r._count, sent: await db.emailLog.count({ where: { template: r.template, status: "SENT" } }) })));

  const [leads, tipsLeads] = await Promise.all([db.lead.count(), db.lead.count({ where: { tipsConsent: true } })]);
  return (
    <PortalPage width="max-w-[1000px]">
      <Panel title="Free-checklist sign-ups" flush={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <p className="text-ink-body"><span className="tnum font-display text-xl font-bold text-ink">{leads}</span> {leads === 1 ? "person has" : "people have"} asked for it · <span className="tnum font-semibold">{tipsLeads}</span> said yes to tips</p>
          {leads > 0 && <a href="/api/admin/leads" download className="text-xs font-semibold">Download CSV</a>}
        </div>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">Only email anyone who ticked “tips”. Never add these people to a mailing without that tick.</p>
      </Panel>
      <Section cols={320}>
        <Panel title="Send a broadcast" flush={false}><BroadcastForm /></Panel>
        <Panel title="Templates & delivery">
          {sentByTemplate.length === 0 ? <Empty>No emails sent yet.</Empty> : sentByTemplate.map((t) => (
            <div key={t.template} className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
              <span className="text-ink-body">{TEMPLATES[t.template as keyof typeof TEMPLATES]?.head ?? t.template}</span>
              <span className="tnum text-ink-faint">{t.sent} / {t.total} sent</span>
            </div>
          ))}
        </Panel>
      </Section>
    </PortalPage>
  );
}
