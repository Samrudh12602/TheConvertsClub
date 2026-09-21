import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { fmtTime, fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { HOUR } from "@/server/scheduling";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";

/** 24-hour and 1-hour reminders for confirmed sessions. Each is sent once (flags on the session). */
export async function sendReminders(now = new Date()) {
  const settings = await getSettings();
  const out = { r24: 0, r1: 0 };
  const windows = [
    { flag: "reminder24Sent" as const, template: "reminder_24h" as const, from: 23 * HOUR, to: 25 * HOUR, key: "r24" as const },
    { flag: "reminder1Sent" as const, template: "reminder_1h" as const, from: 0.5 * HOUR, to: 1.5 * HOUR, key: "r1" as const },
  ];
  for (const w of windows) {
    const due = await db.session.findMany({
      where: { status: "CONFIRMED", [w.flag]: false, startsAt: { gte: new Date(now.getTime() + w.from), lt: new Date(now.getTime() + w.to) }, student: { isDemo: false } },
      include: { student: true },
    });
    for (const s of due) {
      if (!s.student || !s.startsAt) continue;
      const claimed = await db.session.updateMany({ where: { id: s.id, [w.flag]: false }, data: { [w.flag]: true } });
      if (claimed.count !== 1) continue; // another run got it
      const title = sessionTitle(s.type, s.focus);
      await sendEmail({ template: w.template, to: s.student.email, url: s.meetingUrl ?? `/student/sessions/${s.id}`, vars: { session: title, when: fmtWhen(s.startsAt), time: fmtTime(s.startsAt), deadline: fmtWhen(new Date(s.startsAt.getTime() - settings.cancelNoticeHours * HOUR)) } });
      await notify(s.student.id, { title: `${w.key === "r24" ? "Tomorrow" : "In an hour"}: ${title} at ${fmtTime(s.startsAt)}`, href: `/student/sessions/${s.id}` });
      out[w.key]++;
    }
  }
  return out;
}

/** Feedback overdue list for the admin queue. */
export async function overdueFeedback(now = new Date()) {
  const settings = await getSettings();
  const cutoff = new Date(now.getTime() - settings.feedbackDueHours * HOUR);
  return db.session.findMany({ where: { status: "CONFIRMED", startsAt: { lt: cutoff }, feedback: null }, include: { mentor: { include: { user: { select: { name: true } } } }, student: { select: { name: true } } }, orderBy: { startsAt: "asc" } });
}
