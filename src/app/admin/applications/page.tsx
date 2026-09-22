import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, StatusPill } from "@/components/portal/ui";
import { StageSelect } from "@/components/admin/application-stage-select";
import { PromoteButton } from "@/components/admin/promote-application";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor applications" };

export default async function ApplicationsPage() {
  const apps = await db.mentorApplication.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <PortalPage>
      {apps.length === 0 ? <Empty>No applications yet. Point people to /become-a-mentor.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {apps.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-[11px] border border-line bg-card p-4">
              <div className="flex items-start gap-3">
                {a.photoKey ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private admin-only file, not an optimizable static asset
                  <img src={`/api/files/applications/${a.id}`} alt="" className="size-14 flex-none rounded-lg border border-line-soft object-cover" />
                ) : (
                  <span aria-hidden className="flex size-14 flex-none items-center justify-center rounded-lg border border-dashed border-line-strong text-[10px] text-ink-faint">No photo</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-sm font-bold leading-[1.3] text-ink">{a.name}</p>
                    {a.recommendedTier && <span className="flex-none rounded bg-oxblood px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">rec. {a.recommendedTier}</span>}
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-faint">{a.institute}</p>
                  {a.linkedinUrl && <Link href={a.linkedinUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[11.5px] font-semibold">LinkedIn ↗</Link>}
                </div>
              </div>
              <p className="text-[12px] leading-[1.5] text-ink-2">{a.callsConverted}</p>
              <p className="text-[11.5px] text-ink-faint">{a.email} · {a.phone} · {a.hoursPerWeek}h/wk · applied {fmtDate(a.createdAt)}</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                {a.promotedMentorId ? (
                  <StatusPill tone="green">Promoted to mentor</StatusPill>
                ) : (
                  <>
                    <StageSelect id={a.id} stage={a.stage} />
                    <PromoteButton applicationId={a.id} defaultTier={a.recommendedTier ?? "JUNIOR"} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
