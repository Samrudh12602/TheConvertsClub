import Link from "next/link";
import { nowMs } from "@/lib/datetime";
import { PortalPage } from "@/components/portal/portal-page";
import { Flash, Panel } from "@/components/portal/ui";
import { WeekGrid, WindowForm, type Cell } from "@/components/mentor/availability-manager";
import { db } from "@/lib/db";
import { fmtDay } from "@/lib/format";
import { requireMentor } from "@/server/session";
import { HOUR, istDateString, istDayRange, istToUtc } from "@/server/scheduling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Availability" };

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { mentor } = await requireMentor();
  const sp = await searchParams;
  const today = istDateString(new Date());
  const start = /^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "") ? sp.week! : today;
  const dayStrs = Array.from({ length: 7 }, (_, i) => istDateString(new Date(istDayRange(start).from.getTime() + i * 24 * HOUR + HOUR)));
  const from = istDayRange(dayStrs[0]).from, to = istDayRange(dayStrs[6]).to;
  const slots = await db.slot.findMany({ where: { mentorId: mentor.id, startsAt: { gte: from, lt: to } }, include: { session: { include: { student: { select: { name: true } } } } } });
  const bySlot = new Map(slots.map((s) => [s.startsAt.getTime(), s]));
  const now = nowMs();

  const rows = HOURS.map((h) => ({
    hour: hourLabel(h),
    cells: dayStrs.map((d): Cell => {
      const at = istToUtc(d, `${h}:00`);
      const s = bySlot.get(at.getTime());
      const iso = at.toISOString();
      if (s?.status === "BOOKED") return { iso, state: "booked", label: s.session?.student?.name?.replace(/\s*\(demo\)/, "").split(" ")[0] ?? "Booked" };
      if (s?.status === "BLOCKED") return { iso, state: "blocked" };
      if (s) return { iso, state: "open" };
      return { iso, state: at.getTime() < now ? "past" : "none" };
    }),
  }));
  const shift = (n: number) => istDateString(new Date(istDayRange(start).from.getTime() + n * 7 * 24 * HOUR + HOUR));
  const days = dayStrs.map((d) => fmtDay(istToUtc(d, "12:00")).replace(/, .*/, "").replace(/^(\w+) (\d+).*/, "$1 $2"));

  return (
    <PortalPage>
      <WindowForm defaultDate={today} weekStart={dayStrs[0]} />
      <Panel title={<span>Week of {fmtDay(istToUtc(dayStrs[0], "12:00"))} · 1-hour slots</span>} action={
        <div className="flex items-center gap-3 text-[10.5px] font-medium text-ink-muted">
          <span className="flex items-center gap-[5px]"><i className="size-[9px] rounded-sm bg-oxblood" />Booked</span>
          <span className="flex items-center gap-[5px]"><i className="size-[9px] rounded-sm border border-[#DED3C4] bg-[#EFE7DC]" />Open</span>
          <span className="flex items-center gap-[5px]"><i className="size-[9px] rounded-sm border border-dashed border-[#CFC6B9]" />Not offered</span>
          <Link href={`/mentor/availability?week=${shift(-1)}`} className="ml-2 rounded-md border border-line-strong px-2 py-1.5 text-xs font-semibold no-underline">← Prev</Link>
          <Link href={`/mentor/availability?week=${shift(1)}`} className="rounded-md border border-line-strong px-2 py-1.5 text-xs font-semibold no-underline">Next →</Link>
        </div>
      }>
        <WeekGrid days={days} rows={rows} />
      </Panel>
      <Flash>Booked slots can&apos;t be removed here. Ask Samrudh to move the session and the slot frees up.</Flash>
    </PortalPage>
  );
}
