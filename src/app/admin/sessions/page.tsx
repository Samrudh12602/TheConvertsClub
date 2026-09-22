import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { AdminCancelButton } from "@/components/admin/assign-controls";
import { Empty, StatusPill } from "@/components/portal/ui";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { getSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";
export const metadata = { title: "All sessions" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";
const FILTERS = [["all", "All"], ["upcoming", "Upcoming"], ["overdue", "Feedback overdue"], ["completed", "Completed"]] as const;

export default async function AllSessionsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "upcoming" } = await searchParams;
  const settings = await getSettings();
  const now = new Date();
  let where: Prisma.SessionWhereInput = {};
  if (filter === "overdue") where = { status: "CONFIRMED", startsAt: { lt: new Date(now.getTime() - settings.feedbackDueHours * 3_600_000) }, feedback: null };
  else if (filter === "completed") where = { status: "COMPLETED" };
  else if (filter === "upcoming") where = { status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: now } };
  const sessions = await db.session.findMany({ where, orderBy: { startsAt: filter === "completed" ? "desc" : "asc" }, take: 100, include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } }, feedback: { select: { id: true } } } });

  return (
    <PortalPage width="max-w-[1000px]">
      <div className="flex gap-2" role="tablist" aria-label="Filter">
        {FILTERS.map(([id, label]) => <Link key={id} href={`/admin/sessions?filter=${id}`} role="tab" aria-selected={filter === id} className={`rounded-full border px-3.5 py-2 text-xs font-medium no-underline ${filter === id ? "border-ink bg-ink text-surface hover:text-surface" : "border-line-strong bg-white text-ink-2"}`}>{label}</Link>)}
      </div>
      {sessions.length === 0 ? <Empty>Nothing here.</Empty> : (
        <div className="overflow-x-auto rounded-[10px] border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
            <thead><tr className="border-b border-line">{["When", "Student", "Type", "Mentor", "Status", ""].map((h) => <th key={h} className="type-label px-3 py-2.5 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>
              {sessions.map((s) => {
                const st = s.status === "CONFIRMED" && !s.feedback && s.startsAt! < now ? { label: "Feedback due", tone: "amber" as const } : SESSION_STATUS[s.status];
                return (
                  <tr key={s.id} className="border-b border-line-soft last:border-b-0 hover:bg-surface">
                    <td className="tnum px-3 py-2.5 text-ink-2">{s.startsAt ? fmtWhen(s.startsAt) : "—"}</td>
                    <td className="px-3 py-2.5 text-ink-body">{nm(s.student?.name) || "GD batch"}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{sessionTitle(s.type, s.focus)}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{s.mentor ? nm(s.mentor.user.name) : "—"}</td>
                    <td className="px-3 py-2.5"><StatusPill tone={st.tone}>{st.label}</StatusPill></td>
                    <td className="px-3 py-2.5">{["CONFIRMED", "REQUESTED"].includes(s.status) && <AdminCancelButton sessionId={s.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PortalPage>
  );
}
