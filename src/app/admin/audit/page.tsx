import { PortalPage } from "@/components/portal/portal-page";
import { Empty } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "System";

export default async function AuditPage() {
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { name: true, email: true } } } });
  return (
    <PortalPage width="max-w-[1000px]">
      {rows.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
        <div className="overflow-x-auto rounded-[10px] border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
            <thead><tr className="border-b border-line">{["When", "Actor", "Action", "Entity"].map((h) => <th key={h} className="type-label px-3 py-2.5 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line-soft last:border-b-0">
                  <td className="tnum px-3 py-2 text-ink-faint">{fmtWhen(r.createdAt)}</td>
                  <td className="px-3 py-2 text-ink-2">{nm(r.actor?.name) || r.actor?.email || "System"}</td>
                  <td className="px-3 py-2 font-medium text-ink-body">{r.action}</td>
                  <td className="px-3 py-2 text-ink-faint">{r.entity ? `${r.entity}${r.entityId ? ` · ${r.entityId.slice(0, 10)}…` : ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalPage>
  );
}
