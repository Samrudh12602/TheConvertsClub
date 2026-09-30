import { PortalPage } from "@/components/portal/portal-page";
import { Empty } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resources" };

export default async function Resources() {
  await requireMentor();
  const items = await db.resource.findMany({ where: { audience: "MENTOR" }, orderBy: { sortOrder: "asc" } });
  return (
    <PortalPage>
      {items.length === 0 ? <Empty>How-we-run-a-mock guides show up here.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {items.map((r) => (
            <div key={r.id} className="rounded-[10px] border border-line bg-card p-[15px]">
              <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-oxblood">{r.kind}</p>
              <p className="mt-[9px] text-pretty font-display text-sm font-bold leading-[1.35] text-ink">{r.title}</p>
              {r.meta && <p className="mt-1.5 text-xs leading-normal text-ink-faint">{r.meta}</p>}
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-semibold leading-none text-oxblood no-underline hover:underline">Open &rarr;</a>}
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
