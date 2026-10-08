import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { notify } from "@/server/notify";
import { adminInbox, sendEmail } from "@/server/email";
import { icsAttachment } from "@/server/ics";
import { ensureMeetingUrl } from "@/server/meeting";
import { BookingError, now } from "@/server/booking-shared";

/**
 * Panel PI: the owner leads (Session.mentorId, booked from the owner's own hours). The owner then picks two other mentors;
 * each gets a slot for that hour created automatically and an invite they accept or decline in their portal
 * (SessionPanelist.status). Pay (a fixed ₹300 each) accrues only to panelists who accepted, when the lead submits the feedback.
 */

export const PANEL_SEATS = 2;

export class PanelError extends Error {}

/** Pure: how far along the panel is. */
export function panelSummary(seats: { status: "INVITED" | "ACCEPTED" | "DECLINED" }[]) {
  const live = seats.filter((s) => s.status !== "DECLINED");
  const accepted = live.filter((s) => s.status === "ACCEPTED").length;
  return { accepted, invited: live.length - accepted, declined: seats.length - live.length, picked: live.length, ready: accepted >= PANEL_SEATS };
}

type Tx = Prisma.TransactionClient;
type Seat = { id: string; slotId: string | null; slotCreated: boolean };

/** Give a seat's hour back: a slot we created is deleted; a slot that was already one of their open hours goes back to open. */
async function freeSeat(tx: Tx, seat: Seat) {
  if (!seat.slotId) return;
  if (seat.slotCreated) await tx.slot.deleteMany({ where: { id: seat.slotId } });
  else await tx.slot.updateMany({ where: { id: seat.slotId }, data: { status: "OPEN", heldById: null, heldUntil: null } });
}

/** Free every live seat of a cancelled panel. The rows stay as a record of who was invited. */
export async function releasePanelSeats(tx: Tx, sessionId: string) {
  const seats = await tx.sessionPanelist.findMany({ where: { sessionId, status: { not: "DECLINED" } }, select: { id: true, slotId: true, slotCreated: true } });
  for (const s of seats) {
    await freeSeat(tx, s);
    await tx.sessionPanelist.update({ where: { id: s.id }, data: { slotId: null, status: "DECLINED", respondedAt: now() } });
  }
}

export const panelistsOf = (sessionId: string) =>
  db.sessionPanelist.findMany({ where: { sessionId }, include: { mentor: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: { createdAt: "asc" } });

/**
 * The owner picks the two other panelists for a Panel PI. Each chosen mentor gets that hour booked on their calendar
 * (a slot is created if they hadn't offered it) and an invite to accept. Calling it again replaces the panel: mentors
 * kept stay as they are, dropped ones are released and told, new ones are invited.
 */
export async function setPanelists(actor: { id: string; isDemo: boolean }, sessionId: string, mentorIds: string[]) {
  const ids = [...new Set(mentorIds)];
  if (ids.length !== PANEL_SEATS) throw new PanelError(`Choose ${PANEL_SEATS} different mentors.`);
  const out = await db.$transaction(async (tx) => {
    const s = await tx.session.findUnique({ where: { id: sessionId }, include: { student: true, mentor: { include: { user: true } }, panelists: true } });
    if (!s || s.type !== "PANEL_PI" || !s.startsAt || !s.endsAt) throw new PanelError("That isn't a Panel PI session.");
    if (!["CONFIRMED", "REQUESTED"].includes(s.status)) throw new PanelError("Only upcoming Panel PIs can be staffed.");
    if (s.startsAt.getTime() <= now().getTime()) throw new PanelError("That session has already started.");
    if (actor.isDemo && !s.student?.isDemo) throw new PanelError("The demo admin can only work with demo data.");
    const mentors = await tx.mentorProfile.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, include: { user: true } });
    if (mentors.length !== PANEL_SEATS) throw new PanelError("One of those mentors isn't active.");
    for (const m of mentors) {
      if (m.isAdminMentor) throw new PanelError("You're already the lead. Pick two other mentors.");
      if (m.user.isDemo !== Boolean(s.student?.isDemo)) throw new PanelError("Demo and real accounts can't be mixed.");
    }
    // Drop seats that are no longer wanted.
    const removed = s.panelists.filter((p) => p.status !== "DECLINED" && !ids.includes(p.mentorId));
    for (const p of removed) { await freeSeat(tx, p); await tx.sessionPanelist.update({ where: { id: p.id }, data: { slotId: null, status: "DECLINED", respondedAt: now() } }); }
    const invited: { mentorId: string; userId: string; email: string; name: string | null }[] = [];
    for (const m of mentors) {
      const existing = s.panelists.find((p) => p.mentorId === m.id);
      if (existing && existing.status !== "DECLINED") continue; // already invited or accepted: leave them alone
      // Can they do that hour? A booked session of their own, or a seat on another panel at the same time, is a clash.
      const clash = await tx.session.count({ where: { mentorId: m.id, startsAt: s.startsAt, status: { in: ["CONFIRMED", "REQUESTED"] }, id: { not: s.id } } });
      const seatClash = await tx.sessionPanelist.count({ where: { mentorId: m.id, status: { not: "DECLINED" }, sessionId: { not: s.id }, session: { startsAt: s.startsAt, status: { in: ["CONFIRMED", "REQUESTED"] } } } });
      if (clash || seatClash) throw new PanelError(`${m.user.name ?? "That mentor"} already has a session at that time.`);
      const slot = await tx.slot.findUnique({ where: { mentorId_startsAt: { mentorId: m.id, startsAt: s.startsAt } } });
      let slotId: string; let created = false;
      if (slot) {
        const free = slot.status === "OPEN" || (slot.status === "HELD" && slot.heldUntil !== null && slot.heldUntil < now());
        if (!free) throw new PanelError(`${m.user.name ?? "That mentor"} has that hour booked or blocked.`);
        await tx.slot.update({ where: { id: slot.id }, data: { status: "BOOKED", heldById: null, heldUntil: null } });
        slotId = slot.id;
      } else {
        slotId = (await tx.slot.create({ data: { mentorId: m.id, startsAt: s.startsAt, endsAt: s.endsAt, status: "BOOKED", direct: false } })).id;
        created = true;
      }
      if (existing) await tx.sessionPanelist.update({ where: { id: existing.id }, data: { status: "INVITED", respondedAt: null, slotId, slotCreated: created } });
      else await tx.sessionPanelist.create({ data: { sessionId: s.id, mentorId: m.id, slotId, slotCreated: created } });
      invited.push({ mentorId: m.id, userId: m.userId, email: m.user.email, name: m.user.name });
    }
    return { s, invited, removed: removed.map((p) => p.mentorId) };
  });

  const { s, invited } = out;
  const when = fmtWhen(s.startsAt!);
  const meeting = await ensureMeetingUrl(s.id);
  for (const m of invited) {
    await sendEmail({
      template: "panel_invite", to: m.email, url: `/mentor/sessions/${s.id}`,
      vars: { student: s.student?.name ?? "a student", when, lead: s.mentor?.user.name ?? "The lead" },
      details: [{ k: "When", v: `${when} IST` }, { k: "Student", v: s.student?.name ?? "—" }, { k: "Pay", v: "₹300 once the feedback is submitted" }],
      attachments: s.endsAt ? [icsAttachment({ uid: `${s.id}-${m.mentorId}`, title: `Panel PI with ${s.student?.name ?? "a student"}`, startsAt: s.startsAt!, endsAt: s.endsAt, url: meeting })] : undefined,
    });
    await notify(m.userId, { title: `Panel invite: ${s.student?.name ?? "a student"}, ${when}. Accept or decline`, href: `/mentor/sessions/${s.id}` });
  }
  if (out.removed.length) {
    const gone = await db.mentorProfile.findMany({ where: { id: { in: out.removed } }, include: { user: true } });
    for (const g of gone) await notify(g.userId, { title: `You're no longer needed on the Panel PI at ${when}`, href: "/mentor/sessions" });
  }
  return { invited: invited.length, removed: out.removed.length };
}

/** A panelist accepts or declines their invite. Declining frees their hour and tells the owner to pick someone else. */
export async function respondToPanel(mentorId: string, sessionId: string, accept: boolean) {
  const out = await db.$transaction(async (tx) => {
    const seat = await tx.sessionPanelist.findUnique({ where: { sessionId_mentorId: { sessionId, mentorId } }, include: { session: { include: { student: true, mentor: { include: { user: true } }, panelists: true } }, mentor: { include: { user: true } } } });
    if (!seat || seat.status === "DECLINED") throw new BookingError("That invite isn't open any more.", "NOT_FOUND");
    const s = seat.session;
    if (!["CONFIRMED", "REQUESTED"].includes(s.status) || !s.startsAt || s.startsAt.getTime() <= now().getTime()) throw new BookingError("That session is no longer upcoming.", "NOT_ALLOWED");
    if (accept) {
      if (seat.status === "ACCEPTED") return { seat, s, accept, nowReady: false };
      await tx.sessionPanelist.update({ where: { id: seat.id }, data: { status: "ACCEPTED", respondedAt: now() } });
      const after = s.panelists.map((p) => (p.id === seat.id ? { ...p, status: "ACCEPTED" as const } : p));
      return { seat, s, accept, nowReady: panelSummary(after).ready };
    }
    await freeSeat(tx, seat);
    await tx.sessionPanelist.update({ where: { id: seat.id }, data: { status: "DECLINED", respondedAt: now(), slotId: null } });
    return { seat, s, accept, nowReady: false };
  });

  const { seat, s } = out;
  const who = seat.mentor.user.name ?? "A panelist";
  const when = fmtWhen(s.startsAt!);
  const title = sessionTitle(s.type, s.focus);
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE", isDemo: Boolean(s.student?.isDemo) }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, { title: `${who} ${out.accept ? "accepted" : "declined"} the panel for ${s.student?.name ?? "a student"} (${when})`, href: "/admin/scheduler" })));
  const inbox = adminInbox();
  if (inbox && !s.student?.isDemo) {
    await sendEmail({ template: "panel_response", to: inbox, url: "/admin/scheduler", vars: { mentor: who, answer: out.accept ? "accepted" : "declined", student: s.student?.name ?? "a student", when },
      details: [{ k: "Session", v: title }, { k: "When", v: `${when} IST` }, { k: "Next", v: out.accept ? (out.nowReady ? "Panel complete" : "Waiting on the other panelist") : "Pick another panelist" }] });
  }
  if (out.nowReady && s.student) {
    await sendEmail({ template: "panel_confirmed", to: s.student.email, url: `/student/sessions/${s.id}`, vars: { when } });
    await notify(s.student.id, { title: `Your panel is confirmed for ${when}`, href: `/student/sessions/${s.id}` });
  }
  return { accepted: out.accept, ready: out.nowReady };
}
