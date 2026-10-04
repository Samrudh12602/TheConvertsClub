import { db } from "@/lib/db";
import { tidyName } from "@/lib/format";

export interface BoardEntry { mentorId: string; name: string; mocks: number; rating: number | null; ratings: number }
export interface Ranked extends BoardEntry { rank: number }

/** "Rohan Kulkarni (demo)" -> "Rohan K." — a mentor board shows peers' names, not their full identity. */
export function shortName(name: string | null | undefined): string {
  const parts = tidyName((name ?? "Mentor").replace(/\s*\(demo.*?\)/, "")).split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

/** Pure: more completed mocks first; ties go to the higher rating, then alphabetical. Equal scores share a rank. */
export function rankBoard(entries: BoardEntry[]): Ranked[] {
  const sorted = [...entries].sort((a, b) => b.mocks - a.mocks || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
  let rank = 0;
  return sorted.map((e, i) => {
    const prev = sorted[i - 1];
    if (!prev || prev.mocks !== e.mocks || (prev.rating ?? 0) !== (e.rating ?? 0)) rank = i + 1;
    return { ...e, rank };
  });
}

/** Mentors' completed sessions over the last `days` days. Demo and real mentors never mix on one board. */
export async function mentorBoard(forDemo: boolean, days = 30, now = new Date()): Promise<Ranked[]> {
  const since = new Date(now.getTime() - days * 86_400_000);
  const mentors = await db.mentorProfile.findMany({
    where: { status: "ACTIVE", isAdminMentor: false, user: { isDemo: forDemo } },
    select: { id: true, user: { select: { name: true } } },
  });
  if (mentors.length === 0) return [];
  const ids = mentors.map((m) => m.id);
  const [done, ratings] = await Promise.all([
    db.session.groupBy({ by: ["mentorId"], where: { mentorId: { in: ids }, status: "COMPLETED", startsAt: { gte: since } }, _count: true }),
    db.sessionRating.findMany({ where: { session: { mentorId: { in: ids }, startsAt: { gte: since } } }, select: { rating: true, session: { select: { mentorId: true } } } }),
  ]);
  const count = new Map(done.map((d) => [d.mentorId, d._count]));
  const agg = new Map<string, { sum: number; n: number }>();
  for (const r of ratings) {
    const id = r.session.mentorId;
    if (!id) continue;
    const a = agg.get(id) ?? { sum: 0, n: 0 };
    a.sum += r.rating; a.n++;
    agg.set(id, a);
  }
  return rankBoard(mentors.map((m) => {
    const a = agg.get(m.id);
    return { mentorId: m.id, name: shortName(m.user.name), mocks: count.get(m.id) ?? 0, rating: a ? a.sum / a.n : null, ratings: a?.n ?? 0 };
  }));
}
