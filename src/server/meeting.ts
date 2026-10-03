import { db } from "@/lib/db";

/**
 * A mentor who hasn't pasted their own meeting link still needs a working "Join" button on every session.
 * Jitsi Meet is free, needs no account and no API key, and a room exists the moment someone opens its URL.
 * The room name embeds the (unguessable) session id, so each session gets its own unlisted room.
 */
export const fallbackRoomUrl = (sessionId: string) => `https://meet.jit.si/ConvertClub-${sessionId}`;

/** Returns the session's meeting link, filling in a private video room first if it has none. */
export async function ensureMeetingUrl(sessionId: string): Promise<string | null> {
  const s = await db.session.findUnique({ where: { id: sessionId }, select: { meetingUrl: true } });
  if (!s) return null;
  if (s.meetingUrl) return s.meetingUrl;
  const url = fallbackRoomUrl(sessionId);
  await db.session.updateMany({ where: { id: sessionId, meetingUrl: null }, data: { meetingUrl: url } });
  return url;
}
