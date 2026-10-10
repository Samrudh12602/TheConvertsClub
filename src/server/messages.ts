import { db } from "@/lib/db";
import { MAX_MESSAGE_LENGTH } from "@/lib/message-limits";
import { notify } from "@/server/notify";
import type { Role } from "@/generated/prisma/client";

export class MessageError extends Error {}

type Sender = { id: string; name: string | null; role: Role; isDemo: boolean };

/** Demo accounts only ever talk to demo admins and real accounts to real admins, so test chatter never reaches the real inbox. */
export async function adminsFor(isDemo: boolean) {
  return db.user.findMany({ where: { role: "ADMIN", isDemo, status: "ACTIVE", deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true } });
}

const homeFor = (role: Role, id: string) => (role === "STUDENT" ? "/student/messages" : role === "MENTOR" ? "/mentor/messages" : `/admin/messages?u=${id}`);

/**
 * Admin -> a student or mentor (`toUserId` required), or student/mentor -> the team (stored once against the primary
 * admin; every admin is notified and can reply from the inbox).
 */
export async function sendMessage(sender: Sender, input: { body: string; toUserId?: string }) {
  const body = input.body.trim();
  if (!body) throw new MessageError("Write a message first.");
  if (body.length > MAX_MESSAGE_LENGTH) throw new MessageError(`Keep it under ${MAX_MESSAGE_LENGTH} characters.`);

  if (sender.role === "ADMIN") {
    if (!input.toUserId) throw new MessageError("Choose who to message.");
    const to = await db.user.findUnique({ where: { id: input.toUserId }, select: { id: true, role: true, status: true, deletedAt: true } });
    if (!to || to.deletedAt || to.status !== "ACTIVE" || to.role === "ADMIN") throw new MessageError("That person can't be messaged.");
    await db.message.create({ data: { fromUserId: sender.id, toUserId: to.id, body } });
    await notify(to.id, { title: "New message from The Converts Club", body: body.slice(0, 140), href: homeFor(to.role, to.id) });
    return;
  }

  const admins = await adminsFor(sender.isDemo);
  if (admins.length === 0) throw new MessageError("No one is available to receive messages right now. Please email us instead.");
  await db.message.create({ data: { fromUserId: sender.id, toUserId: admins[0].id, body } });
  const who = sender.name?.replace(/\s*\(demo.*?\)/i, "") || "Someone";
  await Promise.all(admins.map((a) => notify(a.id, { title: `New message from ${who}`, body: body.slice(0, 140), href: homeFor("ADMIN", sender.id) })));
}

/** The whole conversation between one student/mentor and the team (any admin), oldest first. */
export async function getThread(userId: string) {
  const rows = await db.message.findMany({
    where: { OR: [{ fromUserId: userId, to: { role: "ADMIN" } }, { toUserId: userId, from: { role: "ADMIN" } }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, body: true, createdAt: true, fromUserId: true },
  });
  return rows.reverse().map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, mine: m.fromUserId === userId }));
}

/** Admin inbox: one row per student/mentor, newest activity first, flagged when the last word was theirs. */
export async function getInbox(isDemo: boolean) {
  const rows = await db.message.findMany({
    where: { OR: [{ from: { role: { not: "ADMIN" }, isDemo }, to: { role: "ADMIN" } }, { to: { role: { not: "ADMIN" }, isDemo }, from: { role: "ADMIN" } }] },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { body: true, createdAt: true, from: { select: { id: true, name: true, role: true } }, to: { select: { id: true, name: true, role: true } } },
  });
  const seen = new Map<string, { userId: string; name: string; role: Role; lastBody: string; lastAt: Date; awaitingReply: boolean }>();
  for (const m of rows) {
    const other = m.from.role === "ADMIN" ? m.to : m.from;
    if (seen.has(other.id)) continue;
    seen.set(other.id, { userId: other.id, name: other.name?.replace(/\s*\(demo.*?\)/i, "") || "Unnamed", role: other.role, lastBody: m.body, lastAt: m.createdAt, awaitingReply: m.from.role !== "ADMIN" });
  }
  return [...seen.values()];
}
