import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { getProducts } from "@/lib/catalog";
import { appUrl } from "@/lib/env";
import { fmtTime, fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { FEATURED_SLUG, priceView } from "@/lib/pricing";
import { adminInbox, sendEmail } from "@/server/email";
import { ensureMeetingUrl } from "@/server/meeting";
import { notify } from "@/server/notify";
import { HOUR } from "@/server/scheduling";

/**
 * Hands-off emails. Everything here is safe to run often and twice: each message leaves a marker (a notification whose
 * link carries `?n=<kind>&k=<key>`, or an EmailLog row) and is skipped if that marker already exists. No schema needed.
 * Real accounts only: demo and `.test` addresses never get mail.
 */

const first = (n?: string | null) => (n ?? "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "there";
const isReal = (email: string) => !/\.test$/i.test(email);

const marked = (userId: string, kind: string, key: string) =>
  db.notification.findFirst({ where: { userId, href: { contains: `?n=${kind}&k=${key}` } }, select: { id: true } }).then(Boolean);

/* ------------------------------------------------ mentor session reminders */

/** 24h and 1h before each confirmed session, the mentor gets the student's profile and the meeting link. One per GD batch. Panel PI panelists get it too. */
export async function sendMentorReminders(now = new Date()) {
  const out = { m24: 0, m1: 0 };
  const windows = [
    { kind: "r24", template: "mentor_reminder_24h" as const, from: 1.5 * HOUR, to: 25 * HOUR, key: "m24" as const },
    { kind: "r1", template: "mentor_reminder_1h" as const, from: 0.15 * HOUR, to: 1.5 * HOUR, key: "m1" as const },
  ];
  type Sess = Awaited<ReturnType<typeof loadDue>>[number];
  const loadDue = (w: (typeof windows)[number]) => db.session.findMany({
    where: { status: "CONFIRMED", mentorId: { not: null }, startsAt: { gte: new Date(now.getTime() + w.from), lt: new Date(now.getTime() + w.to) }, mentor: { user: { isDemo: false, status: "ACTIVE" } } },
    include: { mentor: { include: { user: { select: { id: true, name: true, email: true } } } }, student: { include: { studentProfile: true } }, panelists: { include: { mentor: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
    orderBy: { startsAt: "asc" },
  });
  const remind = async (w: (typeof windows)[number], s: Sess, who: { id: string; email: string }, key: string) => {
    if (!s.startsAt || !isReal(who.email)) return;
    if (await marked(who.id, w.kind, key)) return;
    // Mark first (an in-app notification doubles as the marker), so a second run can't send it again.
    const title = sessionTitle(s.type, s.focus);
    const student = s.type === "GD_BATCH" ? "your GD batch" : first(s.student?.name);
    await notify(who.id, { title: `${w.kind === "r24" ? "Tomorrow" : "In an hour"}: ${title} at ${fmtTime(s.startsAt)}`, href: `/mentor/sessions/${s.id}?n=${w.kind}&k=${key}` });
    const p = s.student?.studentProfile;
    const details = s.type === "GD_BATCH" ? undefined : [
      { k: "Student", v: s.student?.name ?? "—" },
      { k: "When", v: `${fmtWhen(s.startsAt)} IST` },
      ...(s.type === "PANEL_PI" ? [{ k: "Panel", v: [s.mentor?.user.name, ...s.panelists.map((x) => x.mentor.user.name)].filter(Boolean).join(", ") }] : []),
      ...(p?.college ? [{ k: "College", v: p.college }] : []),
      ...(p?.targetInstitutes?.length ? [{ k: "Targets", v: p.targetInstitutes.join(", ") }] : []),
      ...(p?.weakAreas?.length ? [{ k: "Weak areas", v: p.weakAreas.join(", ") }] : []),
    ];
    const url = w.kind === "r1" ? (await ensureMeetingUrl(s.id)) ?? `/mentor/sessions/${s.id}` : `/mentor/sessions/${s.id}`;
    await sendEmail({ template: w.template, to: who.email, url, details, vars: { session: title, student, time: fmtTime(s.startsAt) } });
    out[w.key]++;
  };
  for (const w of windows) {
    for (const s of await loadDue(w)) {
      if (!s.mentor) continue;
      await remind(w, s, s.mentor.user, s.gdBatchId ?? s.id);
      for (const p of s.panelists) await remind(w, s, p.mentor.user, `${s.id}-${p.mentorId}`);
    }
  }
  return out;
}

/* --------------------------------------------------- mentor feedback chaser */

/** Which reminder a session is due: a nudge from 12h, "overdue" once the window passes, "esc" a day after that. */
export function feedbackStage(hoursSinceStart: number, dueHours: number): "none" | "nudge" | "late" | "esc" {
  if (hoursSinceStart < 12) return "none";
  if (hoursSinceStart >= dueHours + 24) return "esc";
  if (hoursSinceStart >= dueHours) return "late";
  return "nudge";
}

/**
 * After a session: a nudge 12 hours in, a firm one when the due time passes, and a final one a day later that also tells
 * the owner. Only the last step reaches the owner, and only once per session, so a late mentor costs one email, not ten.
 */
export async function chaseMentorFeedback(now = new Date()) {
  const settings = await getSettings();
  const out = { reminded: 0, overdue: 0, escalated: 0 };
  const sessions = await db.session.findMany({
    where: { status: "CONFIRMED", feedback: null, mentorId: { not: null }, startsAt: { lt: new Date(now.getTime() - 12 * HOUR), gt: new Date(now.getTime() - 14 * 24 * HOUR) }, mentor: { isAdminMentor: false, user: { isDemo: false, status: "ACTIVE" } } },
    include: { mentor: { include: { user: { select: { id: true, name: true, email: true } } } }, student: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });
  const escalated: { mentor: string; student: string; session: string; hours: number }[] = [];
  for (const s of sessions) {
    if (!s.mentor || !s.startsAt || !isReal(s.mentor.user.email)) continue;
    const ageH = (now.getTime() - s.startsAt.getTime()) / HOUR;
    const dueH = settings.feedbackDueHours;
    const stage = feedbackStage(ageH, dueH);
    const title = sessionTitle(s.type, s.focus);
    const student = s.type === "GD_BATCH" ? "your GD batch" : first(s.student?.name);
    const mentor = s.mentor.user;
    const vars = { session: title, student, due: fmtWhen(new Date(s.startsAt.getTime() + dueH * HOUR)) };
    const href = (n: string) => `/mentor/feedback/${s.id}?n=${n}&k=${s.id}`;
    if (stage === "nudge" && !(await marked(mentor.id, "fb12", s.id))) {
      await notify(mentor.id, { title: `Feedback pending: ${student}, ${title}`, href: href("fb12") });
      await sendEmail({ template: "mentor_feedback_reminder", to: mentor.email, url: `/mentor/feedback/${s.id}`, vars });
      out.reminded++;
    } else if (stage === "late" && !(await marked(mentor.id, "fbdue", s.id))) {
      await notify(mentor.id, { title: `Overdue: feedback for ${student}`, href: href("fbdue") });
      await sendEmail({ template: "mentor_feedback_overdue", to: mentor.email, url: `/mentor/feedback/${s.id}`, vars });
      out.overdue++;
    } else if (stage === "esc" && !(await marked(mentor.id, "fbesc", s.id))) {
      await notify(mentor.id, { title: `Final reminder: feedback for ${student}`, href: href("fbesc") });
      await sendEmail({ template: "mentor_feedback_escalated", to: mentor.email, url: `/mentor/feedback/${s.id}`, vars });
      escalated.push({ mentor: mentor.name ?? mentor.email, student: s.student?.name ?? "GD batch", session: title, hours: Math.round(ageH - dueH) });
      out.escalated++;
    }
  }
  const to = adminInbox();
  if (to && escalated.length) {
    await sendEmail({ template: "admin_escalation", to, url: "/admin/inbox", vars: { count: escalated.length }, details: escalated.slice(0, 12).map((e) => ({ k: e.mentor, v: `${e.student} · ${e.session} · ${e.hours}h late` })) });
  }
  return out;
}

/* -------------------------------------------------- trial -> full follow-up */

/** Two days after a paid trial, one email: what to do next, the flagship plan and any open early-bird seats. Once per person. */
export async function trialFollowUps(now = new Date()) {
  const out = { sent: 0 };
  const orders = await db.order.findMany({
    where: { status: "PAID", product: { slug: { startsWith: "trial-" } }, createdAt: { lt: new Date(now.getTime() - 2 * 24 * HOUR), gt: new Date(now.getTime() - 14 * 24 * HOUR) } },
    include: { product: { select: { name: true } }, user: { select: { isDemo: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!orders.length) return out;
  const products = await getProducts();
  const flagship = products.find((p) => p.slug === FEATURED_SLUG);
  const early = products.filter((p) => p.earlyBird && p.earlyBird.seatsLeft > 0 && p.withAdmin && !p.slug.startsWith("trial-"));
  for (const o of orders) {
    const email = o.guestEmail.toLowerCase();
    if (o.user?.isDemo || !isReal(email)) continue;
    if (await db.emailLog.findFirst({ where: { template: "trial_followup", recipient: { equals: email, mode: "insensitive" } }, select: { id: true } })) continue;
    // Already moved on to a full plan or any other paid product? Then this email would just be noise.
    const bought = await db.order.count({ where: { status: "PAID", guestEmail: { equals: email, mode: "insensitive" }, product: { slug: { not: { startsWith: "trial-" } } } } });
    if (bought > 0) continue;
    const details = [
      ...(flagship ? [{ k: flagship.name, v: `${formatPaise(priceView(flagship).payablePaise)} · ${flagship.includes.slice(0, 2).join(", ")}` }] : []),
      ...early.map((p) => ({ k: `${p.name} (early bird)`, v: `${formatPaise(priceView(p).payablePaise)} · ${p.earlyBird!.seatsLeft} seats left` })),
    ];
    const r = await sendEmail({ template: "trial_followup", to: o.guestEmail, url: `/checkout?product=${FEATURED_SLUG}`, details, vars: { name: first(o.guestName), trial: o.product.name.toLowerCase() } });
    if (r.status === "SENT") out.sent++;
  }
  return out;
}

/* --------------------------------------------------- abandoned checkout */

/** Someone opened payment an hour or more ago and never finished: one friendly email with their cart, once per 3 days. */
export async function abandonedCheckouts(now = new Date()) {
  const out = { sent: 0 };
  const orders = await db.order.findMany({
    where: { status: "CREATED", createdAt: { lt: new Date(now.getTime() - 1 * HOUR), gt: new Date(now.getTime() - 24 * HOUR) }, razorpayOrderId: { not: null } },
    include: { product: { select: { name: true, slug: true } }, user: { select: { isDemo: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  for (const o of orders) {
    const email = o.guestEmail.toLowerCase();
    if (o.user?.isDemo || !isReal(email)) continue;
    const recent = new Date(now.getTime() - 3 * 24 * HOUR);
    if (await db.emailLog.findFirst({ where: { template: "abandoned_checkout", recipient: { equals: email, mode: "insensitive" }, createdAt: { gte: recent } }, select: { id: true } })) continue;
    // They came back and paid (for this or anything else) since? Leave them alone.
    if (await db.order.count({ where: { status: "PAID", guestEmail: { equals: email, mode: "insensitive" }, createdAt: { gte: o.createdAt } } })) continue;
    await sendEmail({ template: "abandoned_checkout", to: o.guestEmail, url: `/checkout?product=${o.product.slug}`, details: [{ k: "In your cart", v: o.product.name }, { k: "Price", v: formatPaise(o.amountPaise) }], vars: { product: o.product.name } });
    out.sent++;
  }
  return out;
}

/* ----------------------------------------------------------- weekly digest */

export async function weeklyDigestData(now = new Date()) {
  const wk = 7 * 24 * HOUR;
  const since = new Date(now.getTime() - wk), prevSince = new Date(now.getTime() - 2 * wk);
  const paid = { status: "PAID" as const, user: { isDemo: false } };
  const [rev, prevRev, orders, completed, openSlots, unassigned, applications, trialOrders, failed] = await Promise.all([
    db.order.aggregate({ where: { ...paid, createdAt: { gte: since } }, _sum: { amountPaise: true } }),
    db.order.aggregate({ where: { ...paid, createdAt: { gte: prevSince, lt: since } }, _sum: { amountPaise: true } }),
    db.order.count({ where: { ...paid, createdAt: { gte: since } } }),
    db.session.count({ where: { status: "COMPLETED", student: { isDemo: false }, startsAt: { gte: since } } }),
    db.slot.count({ where: { status: "OPEN", startsAt: { gt: now, lt: new Date(now.getTime() + wk) }, mentor: { user: { isDemo: false } } } }),
    db.session.count({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now }, student: { isDemo: false } } }),
    db.mentorApplication.count({ where: { stage: { in: ["NEW", "SCREENING", "TRIAL_MOCK"] } } }),
    db.order.findMany({ where: { status: "PAID", product: { slug: { startsWith: "trial-" } }, user: { isDemo: false } }, select: { guestEmail: true, createdAt: true } }),
    db.order.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
  ]);
  const settings = await getSettings();
  const overdue = await db.session.count({ where: { status: "CONFIRMED", feedback: null, startsAt: { lt: new Date(now.getTime() - settings.feedbackDueHours * HOUR) }, student: { isDemo: false }, mentor: { isAdminMentor: false } } });
  const trialsThisWeek = trialOrders.filter((t) => t.createdAt >= since).length;
  const emails = [...new Set(trialOrders.map((t) => t.guestEmail.toLowerCase()))];
  let converted = 0;
  for (const e of emails) {
    if (await db.order.count({ where: { status: "PAID", guestEmail: { equals: e, mode: "insensitive" }, product: { slug: { not: { startsWith: "trial-" } } } } })) converted++;
  }
  return { revenue: rev._sum.amountPaise ?? 0, prevRevenue: prevRev._sum.amountPaise ?? 0, orders, completed, openSlots, unassigned, applications, overdue, failed, trialsThisWeek, trialBuyers: emails.length, trialConverted: converted };
}

export async function sendWeeklyDigest(now = new Date()) {
  const to = adminInbox();
  if (!to) return { sent: false, reason: "no ADMIN_EMAIL" };
  const d = await weeklyDigestData(now);
  const delta = d.prevRevenue > 0 ? Math.round(((d.revenue - d.prevRevenue) / d.prevRevenue) * 100) : null;
  const details = [
    { k: "Revenue", v: `${formatPaise(d.revenue)} from ${d.orders} order${d.orders === 1 ? "" : "s"}${delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta}% vs last week)` : ""}` },
    { k: "Sessions completed", v: String(d.completed) },
    { k: "Open slots, next 7 days", v: String(d.openSlots) },
    { k: "Trial sign-ups", v: `${d.trialsThisWeek} this week · ${d.trialConverted} of ${d.trialBuyers} trial buyers went on to buy` },
    { k: "Needs you", v: `${d.overdue} feedback overdue · ${d.unassigned} unassigned · ${d.applications} applications · ${d.failed} failed payments` },
  ];
  const r = await sendEmail({ template: "admin_digest", to, url: `${appUrl()}/admin/inbox`, details, vars: { revenue: formatPaise(d.revenue) } });
  return { sent: r.status === "SENT", status: r.status };
}
