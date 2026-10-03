import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const ev = { uid: "s1", title: "Mock PI, with Rohan", startsAt: new Date("2026-10-05T11:30:00Z"), endsAt: new Date("2026-10-05T12:30:00Z"), url: "https://meet.example/abc" };

describe("buildIcs", () => {
  const ics = buildIcs(ev, new Date("2026-10-03T00:00:00Z"));
  it("is a well-formed VEVENT with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261005T113000Z");
    expect(ics).toContain("DTEND:20261005T123000Z");
    expect(ics).toContain("UID:s1@convertclub");
  });
  it("escapes commas in text fields", () => {
    expect(ics).toContain("SUMMARY:Mock PI\\, with Rohan");
  });
  it("includes the meeting link", () => {
    expect(ics).toContain("URL:https://meet.example/abc");
  });
  it("folds lines longer than 75 octets", () => {
    const long = buildIcs({ ...ev, description: "x".repeat(200) });
    for (const line of long.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
});
