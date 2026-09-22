import { PortalPage } from "@/components/portal/portal-page";
import { Empty } from "@/components/portal/ui";
import { StageSelect } from "@/components/admin/application-stage-select";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor applications" };

export default async function ApplicationsPage() {
  const apps = await db.mentorApplication.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <PortalPage>
      {apps.length === 0 ? <Empty>No applications yet. Point people to /become-a-mentor.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {apps.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-[11px] border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-2.5">
                <div><p className="font-display text-sm font-bold leading-[1.3] text-ink">{a.name}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{a.institute}</p></div>
                {a.recommendedTier && <span className="rounded bg-oxblood px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">rec. {a.recommendedTier}</span>}
              </div>
              <p className="text-[12px] leading-[1.5] text-ink-2">{a.callsConverted}</p>
              <p className="text-[11.5px] text-ink-faint">{a.email} · {a.phone} · {a.hoursPerWeek}h/wk · applied {fmtDate(a.createdAt)}</p>
              <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-2.5"><StageSelect id={a.id} stage={a.stage} /></div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
