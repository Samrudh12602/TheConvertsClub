import { PortalPage } from "@/components/portal/portal-page";
import { Empty } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library" };

export default async function LibraryPage() {
  await requireStudent();
  const items = await db.resource.findMany({ where: { audience: "STUDENT" }, orderBy: { sortOrder: "asc" } });
  return (
    <PortalPage>
      {items.length === 0 ? <Empty>Prep material from your mentors shows up here.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {items.map((l) => (
            <div key={l.id} className="rounded-[10px] border border-line bg-card p-[15px]">
              <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-oxblood">{l.kind}</p>
              <p className="mt-[9px] text-pretty font-display text-sm font-bold leading-[1.35] text-ink">{l.title}</p>
              {l.meta && <p className="mt-1.5 text-xs leading-normal text-ink-faint">{l.meta}</p>}
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
