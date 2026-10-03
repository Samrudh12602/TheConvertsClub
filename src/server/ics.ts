import type { EmailAttachment } from "@/server/email";

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Content lines are limited to 75 octets; longer ones continue on a line that starts with a space. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75 - (out.length ? 1 : 0);
    while (Buffer.byteLength(rest.slice(0, cut)) > 75 - (out.length ? 1 : 0)) cut--;
    out.push((out.length ? " " : "") + rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  out.push((out.length ? " " : "") + rest);
  return out.join("\r\n");
}

export interface IcsEvent { uid: string; title: string; startsAt: Date; endsAt: Date; description?: string; url?: string | null }

/** A single-event calendar file. Opens as "Add to calendar" in Gmail, Apple Mail and Outlook. */
export function buildIcs(e: IcsEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Convert Club//Sessions//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@convertclub`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(e.startsAt)}`, `DTEND:${stamp(e.endsAt)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
    ...(e.url ? [`LOCATION:${esc(e.url)}`, `URL:${e.url}`] : []),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)} starts in 30 minutes`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsAttachment(e: IcsEvent): EmailAttachment {
  return { filename: "session.ics", content: Buffer.from(buildIcs(e), "utf8"), contentType: "text/calendar; charset=utf-8; method=PUBLISH" };
}
