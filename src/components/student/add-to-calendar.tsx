"use client";

import { CalendarPlus } from "lucide-react";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

/** Adds a session to the student's own calendar: a Google Calendar link, and a downloadable .ics for Apple/Outlook. Built in the browser; nothing is sent anywhere. */
export function AddToCalendar({ id, title, startsAtIso, durationMin = 60, details, tone = "light" }: { id: string; title: string; startsAtIso: string; durationMin?: number; details?: string; tone?: "light" | "dark" }) {
  const start = new Date(startsAtIso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(details ?? "")}`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Convert Club//EN", "BEGIN:VEVENT", `UID:${id}@convertclub`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details ?? "")}`, "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Starts in 1 hour", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const cls = tone === "dark"
    ? "border-white/15 text-dark-text hover:border-white/40 hover:text-white"
    : "border-line-strong bg-white text-ink hover:border-oxblood";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={google} target="_blank" rel="noreferrer" className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold no-underline transition hover:no-underline ${cls}`}><CalendarPlus aria-hidden className="size-4" />Google Calendar</a>
      <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`} download={`${id}.ics`} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold no-underline transition hover:no-underline ${cls}`}><CalendarPlus aria-hidden className="size-4" />Apple / Outlook (.ics)</a>
    </div>
  );
}
