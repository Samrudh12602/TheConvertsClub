import { db } from "@/lib/db";

export interface Quality { mentorId: string; name: string; completed: number; ratingAvg: number | null; ratings: number; feedbackTotal: number; feedbackOnTime: number; overdueNow: number }

export type Flag = "Low rating" | "Late feedback" | "Feedback overdue";

/** Pure: what deserves the admin's attention. Needs a few data points before judging anyone. */
export function qualityFlags(q: Pick<Quality, "ratingAvg" | "ratings" | "feedbackTotal" | "feedbackOnTime" | "overdueNow">): Flag[] {
  const flags: Flag[] = [];
  if (q.ratings >= 3 && q.ratingAvg !== null && q.ratingAvg < 3.5) flags.push("Low rating");
  if (q.feedbackTotal >= 3 && q.feedbackOnTime / q.feedbackTotal < 0.8) flags.push("Late feedback");
  if (q.overdueNow > 0) flags.push("Feedback overdue");
  return flags;
}

/** Last `days` days per active mentor. Demo and real mentors are kept apart, like the leaderboard. */
export async function mentorQuality(forDemo: boolean, dueHours: number, days = 30, now = new Date()): Promise<Quality[]> {
  const since = new Date(now.getTime() - days * 86_400_000);
  const due = dueHours * 3_600_000;
  const mentors = await db.mentorProfile.findMany({ where: { status: "ACTIVE", isAdminMentor: false, user: { isDemo: forDemo } }, select: { id: true, user: { select: { name: true } } } });
  if (!mentors.length) return [];
  const ids = mentors.map((m) => m.id);
  const [sessions, ratings, feedback, overdue] = await Promise.all([
    db.session.groupBy({ by: ["mentorId"], where: { mentorId: { in: ids }, status: "COMPLETED", startsAt: { gte: since } }, _count: true }),
    db.sessionRating.findMany({ where: { session: { mentorId: { in: ids }, startsAt: { gte: since } } }, select: { rating: true, session: { select: { mentorId: true } } } }),
    db.feedback.findMany({ where: { mentorId: { in: ids }, submittedAt: { gte: since } }, select: { mentorId: true, submittedAt: true, session: { select: { startsAt: true } } } }),
    db.session.groupBy({ by: ["mentorId"], where: { mentorId: { in: ids }, status: "CONFIRMED", feedback: null, startsAt: { lt: new Date(now.getTime() - due) } }, _count: true }),
  ]);
  return mentors.map((m) => {
    const rs = ratings.filter((r) => r.session.mentorId === m.id);
    const fb = feedback.filter((f) => f.mentorId === m.id);
    return {
      mentorId: m.id,
      name: (m.user.name ?? "Mentor").replace(/\s*\(demo.*?\)/, ""),
      completed: sessions.find((s) => s.mentorId === m.id)?._count ?? 0,
      ratingAvg: rs.length ? rs.reduce((n, r) => n + r.rating, 0) / rs.length : null,
      ratings: rs.length,
      feedbackTotal: fb.length,
      feedbackOnTime: fb.filter((f) => !f.session?.startsAt || f.submittedAt.getTime() - f.session.startsAt.getTime() <= due).length,
      overdueNow: overdue.find((o) => o.mentorId === m.id)?._count ?? 0,
    };
  }).sort((a, b) => qualityFlags(b).length - qualityFlags(a).length || b.completed - a.completed);
}
