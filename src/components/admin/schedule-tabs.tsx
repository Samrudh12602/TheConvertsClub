import Link from "next/link";
import clsx from "clsx";
import { CalendarDays, ListChecks } from "lucide-react";
import { adminDb } from "@/server/demo";

/** One "Schedule" workspace with two views: the week grid (who's free, book into a slot) and the assignment list. */
export async function ScheduleTabs({ active }: { active: "calendar" | "assign" }) {
  const db = await adminDb();
  const now = new Date();
  const [unassigned, openSlots] = await Promise.all([
    db.session.count({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } } }),
    db.slot.count({ where: { status: "OPEN", startsAt: { gt: now, lt: new Date(now.getTime() + 7 * 86_400_000) } } }),
  ]);
  const tab = (on: boolean) => clsx("inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold no-underline transition-all hover:no-underline", on ? "bg-white text-ink shadow-card hover:text-ink" : "text-ink-muted hover:text-ink");
  return (
    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-line-soft p-1" role="tablist" aria-label="Schedule views">
      <Link href="/admin/calendar" role="tab" aria-selected={active === "calendar"} className={tab(active === "calendar")}><CalendarDays aria-hidden className="size-4" />Week calendar<span className="tnum rounded-full bg-teal-tint px-1.5 py-0.5 text-[10.5px] leading-none text-teal">{openSlots} open</span></Link>
      <Link href="/admin/scheduler" role="tab" aria-selected={active === "assign"} className={tab(active === "assign")}><ListChecks aria-hidden className="size-4" />Assign &amp; manage{unassigned > 0 && <span className="tnum rounded-full bg-oxblood px-1.5 py-0.5 text-[10.5px] leading-none text-white">{unassigned} to assign</span>}</Link>
    </div>
  );
}
