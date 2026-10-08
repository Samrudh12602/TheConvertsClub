import { db as realDb } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { HOUR } from "@/server/scheduling";
import { getInbox } from "@/server/messages";
import { adminDb } from "@/server/demo";

export interface InboxItem { id: string; title: string; meta: string; href: string; tone?: "oxblood" | "amber" | "indigo" }
export interface InboxGroup { key: string; label: string; href: string; cta: string; icon: "clock" | "calendar" | "inbox" | "file" | "gift" | "message" | "alert" | "trash"; items: InboxItem[]; total: number }

const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/i, "") || "Unnamed";
const ago = (d: Date, now: Date) => { const h = Math.round((now.getTime() - d.getTime()) / HOUR); return h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`; };

/** Everything that is waiting on the owner, grouped. Respects demo mode like the rest of the admin portal. */
export async function loadInbox(isDemoViewer: boolean, now = new Date()): Promise<InboxGroup[]> {
  const db = await adminDb();
  const settings = await getSettings();
  const cutoff = new Date(now.getTime() - settings.feedbackDueHours * HOUR);
  const [overdue, unassigned, applications, reviews, unspent, convos, failed, deletions] = await Promise.all([
    db.session.findMany({ where: { status: "CONFIRMED", feedback: null, startsAt: { lt: cutoff } }, orderBy: { startsAt: "asc" }, take: 200, include: { mentor: { include: { user: { select: { name: true } } } }, student: { select: { name: true } } } }),
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { student: { select: { name: true } } } }),
    db.mentorApplication.findMany({ where: { stage: { in: ["NEW", "SCREENING", "TRIAL_MOCK"] } }, orderBy: { createdAt: "asc" } }),
    db.review.findMany({ where: { status: "SUBMITTED" }, orderBy: { submittedAt: "asc" }, include: { student: { select: { name: true } } } }),
    // Students who paid for a session with the owner (trial or direct) and haven't booked it yet.
    db.creditLedger.groupBy({ by: ["userId", "kind"], _sum: { delta: true, reservedDelta: true }, where: { kind: { in: ["TRIAL_GUIDANCE", "TRIAL_PI", "PI_DIRECT", "STRATEGY_DIRECT"] } } }),
    getInbox(isDemoViewer),
    db.order.findMany({ where: { status: "FAILED", createdAt: { gte: new Date(now.getTime() - 7 * 24 * HOUR) } }, orderBy: { createdAt: "desc" }, take: 20, include: { product: { select: { name: true } } } }),
    realDb.auditLog.findMany({ where: { action: "account.deletion_requested", createdAt: { gte: new Date(now.getTime() - 30 * 24 * HOUR) } }, orderBy: { createdAt: "desc" }, take: 20, include: { actor: { select: { id: true, name: true, email: true, deletedAt: true } } } }),
  ]);

  const waitingIds = unspent.filter((u) => (u._sum.delta ?? 0) > 0).map((u) => u.userId);
  const waiters = waitingIds.length ? await db.user.findMany({ where: { id: { in: [...new Set(waitingIds)] }, ...(isDemoViewer ? {} : { isDemo: false }) }, select: { id: true, name: true } }) : [];
  const kinds = new Map<string, string[]>();
  for (const u of unspent) if ((u._sum.delta ?? 0) > 0) kinds.set(u.userId, [...(kinds.get(u.userId) ?? []), u.kind === "TRIAL_GUIDANCE" ? "trial guidance" : u.kind === "TRIAL_PI" ? "trial PI" : u.kind === "PI_DIRECT" ? "PI with you" : "strategy with you"]);
  const waitingDeletion = deletions.filter((d) => d.actor && !d.actor.deletedAt);

  const groups: InboxGroup[] = [
    { key: "overdue", label: "Mentor feedback overdue", href: "/admin/sessions", cta: "Open sessions", icon: "clock", total: overdue.length,
      items: overdue.slice(0, 6).map((s) => ({ id: s.id, title: `${nm(s.mentor?.user.name)} · ${nm(s.student?.name)}`, meta: `${ago(new Date(s.startsAt!.getTime() + settings.feedbackDueHours * HOUR), now)} late`, href: "/admin/sessions", tone: "oxblood" as const })) },
    { key: "unassigned", label: "Sessions needing a mentor", href: "/admin/scheduler", cta: "Open schedule", icon: "calendar", total: unassigned.length,
      items: unassigned.slice(0, 6).map((s) => ({ id: s.id, title: `${nm(s.student?.name)} · ${s.type.replace(/_/g, " ").toLowerCase()}`, meta: s.startsAt ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(s.startsAt) : "", href: "/admin/scheduler", tone: "oxblood" as const })) },
    { key: "trials", label: "Paid sessions with you, not booked yet", href: "/admin/students", cta: "Open students", icon: "gift", total: waiters.length,
      items: waiters.slice(0, 6).map((w) => ({ id: w.id, title: nm(w.name), meta: (kinds.get(w.id) ?? []).join(", "), href: `/admin/students/${w.id}`, tone: "indigo" as const })) },
    { key: "applications", label: "Mentor applications to review", href: "/admin/applications", cta: "Open applications", icon: "inbox", total: applications.length,
      items: applications.slice(0, 6).map((a) => ({ id: a.id, title: nm(a.name), meta: `${a.stage.replace(/_/g, " ").toLowerCase()} · ${ago(a.createdAt, now)}`, href: "/admin/applications", tone: "amber" as const })) },
    { key: "reviews", label: "WAT / SOP reviews waiting for a mentor", href: "/admin/reviews", cta: "Open reviews", icon: "file", total: reviews.length,
      items: reviews.slice(0, 6).map((r) => ({ id: r.id, title: `${nm(r.student?.name)} · ${r.kind.replace(/_/g, " ")}`, meta: `waiting ${ago(r.submittedAt, now)}`, href: "/admin/reviews", tone: "amber" as const })) },
    { key: "messages", label: "Messages awaiting your reply", href: "/admin/messages", cta: "Open messages", icon: "message", total: convos.filter((c) => c.awaitingReply).length,
      items: convos.filter((c) => c.awaitingReply).slice(0, 6).map((c) => ({ id: c.userId, title: c.name, meta: `${c.role.toLowerCase()} · ${ago(c.lastAt, now)}`, href: `/admin/messages?u=${c.userId}`, tone: "indigo" as const })) },
    { key: "failed", label: "Failed payments, last 7 days", href: "/admin/finance", cta: "Open finance", icon: "alert", total: failed.length,
      items: failed.slice(0, 6).map((o) => ({ id: o.id, title: `${o.guestName} · ${o.product.name}`, meta: `${o.guestEmail} · ${ago(o.createdAt, now)} ago`, href: "/admin/finance", tone: "amber" as const })) },
    { key: "deletions", label: "Account deletion requests", href: "/admin/students", cta: "Open students", icon: "trash", total: waitingDeletion.length,
      items: waitingDeletion.slice(0, 6).map((d) => ({ id: d.id, title: nm(d.actor!.name ?? d.actor!.email), meta: `requested ${ago(d.createdAt, now)} ago`, href: `/admin/students/${d.actor!.id}`, tone: "oxblood" as const })) },
  ];
  return groups;
}

/** People and patterns worth a second look. Counts only; the owner decides what they mean. */
export async function loadWatchlist(now = new Date()) {
  const week = new Date(now.getTime() - 7 * 24 * HOUR);
  const [failedByEmail, trialBlocks, manyOrders] = await Promise.all([
    realDb.order.groupBy({ by: ["guestEmail"], where: { status: "FAILED", createdAt: { gte: week } }, _count: true, having: { guestEmail: { _count: { gte: 3 } } } }),
    realDb.auditLog.groupBy({ by: ["entityId"], where: { action: "checkout.trial_blocked", createdAt: { gte: new Date(now.getTime() - 30 * 24 * HOUR) } }, _count: true, having: { entityId: { _count: { gte: 2 } } } }),
    realDb.order.groupBy({ by: ["guestEmail"], where: { status: "CREATED", createdAt: { gte: week } }, _count: true, having: { guestEmail: { _count: { gte: 6 } } } }),
  ]);
  return {
    failedPayments: failedByEmail.map((r) => ({ who: r.guestEmail, n: r._count })),
    trialRetries: trialBlocks.map((r) => ({ who: r.entityId ?? "unknown", n: r._count })),
    manyCarts: manyOrders.map((r) => ({ who: r.guestEmail, n: r._count })),
  };
}
