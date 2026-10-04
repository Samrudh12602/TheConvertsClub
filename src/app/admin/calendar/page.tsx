import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Flash } from "@/components/portal/ui";
import { CalendarGrid, type CalRow, type Chip, type StudentOpt } from "@/components/admin/calendar-grid";
import { nowMs } from "@/lib/datetime";
import { fmtDay, tidyName } from "@/lib/format";
import { adminDb } from "@/server/demo";
import { HOUR, istDateString, istDayRange, istToUtc } from "@/server/scheduling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor calendar" };

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
const first = (n?: string | null) => tidyName((n ?? "").replace(/\(.*?\)/g, "")).split(/\s+/)[0] || "Mentor";
const ORDER = { OPEN: 0, HELD: 1, BOOKED: 2, BLOCKED: 3 } as const;

/**
 * Every mentor's hours on one calendar. Several mentors can be free at the same hour (that is how two students
 * can book the same time), so each hour lists all of them. Click a free mentor to book a student into that slot.
 */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string; mentor?: string }> }) {
  const db = await adminDb();
  const sp = await searchParams;
  const today = istDateString(new Date());
  const start = /^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "") ? sp.week! : today;
  const dayStrs = Array.from({ length: 7 }, (_, i) => istDateString(new Date(istDayRange(start).from.getTime() + i * 24 * HOUR + HOUR)));
  const from = istDayRange(dayStrs[0]).from, to = istDayRange(dayStrs[6]).to;
  const now = nowMs();

  const [mentors, slots, students, ledger] = await Promise.all([
    db.mentorProfile.findMany({ where: { status: "ACTIVE" }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    db.slot.findMany({
      where: { startsAt: { gte: from, lt: to }, mentor: { status: "ACTIVE", ...(sp.mentor ? { id: sp.mentor } : {}) } },
      include: { mentor: { include: { user: { select: { name: true } } } }, session: { include: { student: { select: { name: true } } } } },
    }),
    db.user.findMany({ where: { role: "STUDENT", status: "ACTIVE" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 500 }),
    db.creditLedger.groupBy({ by: ["userId", "kind"], _sum: { delta: true } }),
  ]);

  const byStart = new Map<number, Chip[]>();
  for (const s of slots) {
    const list = byStart.get(s.startsAt.getTime()) ?? [];
    list.push({ slotId: s.id, mentorId: s.mentorId, mentor: first(s.mentor.user.name), status: s.status, student: s.session?.student?.name ? first(s.session.student.name) : undefined, admin: s.mentor.isAdminMentor });
    byStart.set(s.startsAt.getTime(), list);
  }
  const rows: CalRow[] = HOURS.map((h) => ({
    hour: hourLabel(h),
    cells: dayStrs.map((d) => {
      const at = istToUtc(d, `${h}:00`);
      return { iso: at.toISOString(), past: at.getTime() < now, chips: (byStart.get(at.getTime()) ?? []).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.mentor.localeCompare(b.mentor)) };
    }),
  }));

  const credits = new Map<string, Record<string, number>>();
  for (const l of ledger) credits.set(l.userId, { ...(credits.get(l.userId) ?? {}), [l.kind]: l._sum.delta ?? 0 });
  const opts: StudentOpt[] = students.map((s) => ({ id: s.id, label: `${first(s.name)} · ${s.email}`, credits: credits.get(s.id) ?? {} }));

  const shift = (n: number) => istDateString(new Date(istDayRange(start).from.getTime() + n * 7 * 24 * HOUR + HOUR));
  const q = (week: string, mentor?: string) => `?week=${week}${mentor ? `&mentor=${mentor}` : ""}`;
  const days = dayStrs.map((d) => ({ date: d, label: fmtDay(istToUtc(d, "12:00")) }));
  const openCount = slots.filter((s) => s.status === "OPEN" && s.startsAt.getTime() > now).length;

  return (
    <PortalPage width="max-w-[1180px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={q(shift(-1), sp.mentor)} className="rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">← Prev week</Link>
          <Link href={q(today, sp.mentor)} className="rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">This week</Link>
          <Link href={q(shift(1), sp.mentor)} className="rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">Next week →</Link>
        </div>
        <p className="text-[12.5px] text-ink-faint"><span className="tnum font-semibold text-ink">{openCount}</span> open slots this week · times in IST</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={q(start)} className={`rounded-full px-3 py-1.5 text-xs font-semibold no-underline hover:no-underline ${!sp.mentor ? "bg-ink text-white" : "border border-line-strong bg-white text-ink-2"}`}>All mentors</Link>
        {mentors.map((m) => <Link key={m.id} href={q(start, m.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold no-underline hover:no-underline ${sp.mentor === m.id ? "bg-ink text-white" : "border border-line-strong bg-white text-ink-2"}`}>{m.isAdminMentor ? "★ " : ""}{first(m.user.name)}</Link>)}
      </div>
      {mentors.length === 0 ? <Flash>No active mentors yet.</Flash> : openCount === 0 && slots.length === 0 && <Flash>Nobody has published hours for this week. Add some from a mentor&apos;s page (Admin → Mentors), or yours under Mentor mode.</Flash>}
      <CalendarGrid days={days} rows={rows} students={opts} />
    </PortalPage>
  );
}
