import { PortalPage } from "@/components/portal/portal-page";
import { Empty } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { relative } from "@/lib/format";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function Messages() {
  const { user } = await requireMentor();
  const msgs = await db.message.findMany({ where: { toUserId: user.id }, orderBy: { createdAt: "desc" }, take: 30, include: { from: { select: { name: true } } } });
  return (
    <PortalPage width="max-w-[700px]">
      {msgs.length === 0 ? <Empty>No messages.</Empty> : msgs.map((m) => (
        <div key={m.id} className="rounded-[10px] border border-line border-l-[3px] border-l-oxblood bg-card p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5"><p className="text-[13px] font-semibold leading-[1.3] text-ink">{m.from.name?.replace(/\s*\(demo.*?\)/, "") ?? "Samrudh"}</p><p className="text-[11px] leading-none text-ink-faint">{relative(m.createdAt)}</p></div>
          <p className="mt-1.5 text-pretty text-[13px] leading-[1.6] text-ink-2">{m.body}</p>
        </div>
      ))}
    </PortalPage>
  );
}
