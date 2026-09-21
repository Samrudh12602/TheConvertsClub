import { PortalPage } from "@/components/portal/portal-page";
import { nowMs } from "@/lib/datetime";
import { Empty, StatusPill } from "@/components/portal/ui";
import { AddCall, OutcomeSelect } from "@/components/student/calls-manager";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { CALL_OUTCOME } from "@/lib/labels";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My calls" };

export default async function CallsPage() {
  const user = await requireStudent();
  const calls = await db.callTracker.findMany({ where: { studentId: user.id }, orderBy: [{ interviewDate: { sort: "asc", nulls: "last" } }] });
  return (
    <PortalPage width="max-w-[820px]">
      <AddCall />
      {calls.length === 0 ? <Empty>No calls tracked yet.</Empty> : calls.map((c) => {
        const days = c.interviewDate ? Math.ceil((c.interviewDate.getTime() - nowMs()) / 86_400_000) : null;
        const o = CALL_OUTCOME[c.outcome];
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-line bg-card p-[15px]">
            <div className="min-w-[200px] flex-[1_1_200px]">
              <p className="font-display text-sm font-bold leading-[1.3] text-ink">{c.institute}</p>
              <p className="mt-1 text-xs leading-[1.4] text-ink-faint">{c.interviewDate ? fmtDate(c.interviewDate) : "Awaiting"}{c.stage ? ` · ${c.stage}` : ""}</p>
            </div>
            {days !== null && days > 0 && c.outcome === "SCHEDULED" && <span className="tnum flex-none text-xs font-semibold text-oxblood">{days} day{days === 1 ? "" : "s"}</span>}
            <StatusPill tone={o.tone}>{o.label}</StatusPill>
            <OutcomeSelect id={c.id} value={c.outcome} />
          </div>
        );
      })}
    </PortalPage>
  );
}
