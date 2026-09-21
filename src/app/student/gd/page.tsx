import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, StatusPill } from "@/components/portal/ui";
import { GdButton } from "@/components/student/gd-actions";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "GD / GE batches" };

export default async function GdPage() {
  const user = await requireStudent();
  const batches = await db.gdBatch.findMany({
    where: { startsAt: { gt: new Date() }, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" },
    include: { participants: true, moderator: { include: { user: { select: { name: true } } } } },
  });
  return (
    <PortalPage>
      <Flash>Joining a batch uses one GD credit. If it&apos;s full you go on the waitlist and we promote you the moment a seat frees up.</Flash>
      {batches.length === 0 ? <Empty>No batches scheduled yet. New ones are posted every week.</Empty> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
          {batches.map((b) => {
            const joined = b.participants.filter((p) => p.status === "JOINED");
            const waiting = b.participants.filter((p) => p.status === "WAITLISTED");
            const mine = b.participants.find((p) => p.studentId === user.id && p.status !== "LEFT");
            const free = b.capacity - joined.length;
            const state = mine?.status === "JOINED" ? { t: "You're in", tone: "indigo" as const } : mine?.status === "WAITLISTED" ? { t: "On waitlist", tone: "amber" as const } : free <= 0 ? { t: "Full", tone: "oxblood" as const } : { t: `${free} seat${free === 1 ? "" : "s"} left`, tone: "green" as const };
            return (
              <div key={b.id} className="rounded-[11px] border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <h2 className="font-display text-sm font-bold leading-[1.3] text-ink">{b.topic}</h2>
                    <p className="mt-1 text-xs leading-[1.4] text-ink-faint">{fmtWhen(b.startsAt)}{b.moderator?.user.name ? ` · ${b.moderator.user.name.replace(/\s*\(demo\)/, "")}` : ""}</p>
                  </div>
                  <StatusPill tone={state.tone}>{state.t}</StatusPill>
                </div>
                <div className="mt-3.5 flex gap-1" aria-hidden>
                  {Array.from({ length: b.capacity }, (_, i) => <span key={i} className={`h-[7px] flex-1 rounded-[3px] ${i < joined.length ? "bg-oxblood" : "bg-line"}`} />)}
                </div>
                <div className="mt-[13px] flex items-center justify-between gap-2.5">
                  <span className="text-xs font-medium text-ink-muted">{joined.length} of {b.capacity} joined{waiting.length ? ` · ${waiting.length} waitlisted` : ""}</span>
                  {mine ? <GdButton batchId={b.id} mode="leave" label={mine.status === "WAITLISTED" ? "Leave waitlist" : "Leave batch"} /> : <GdButton batchId={b.id} mode={free > 0 ? "join" : "waitlist"} label={free > 0 ? "Join batch" : "Join waitlist"} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
}
