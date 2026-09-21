import { describe, expect, it } from "vitest";
import { canReschedule, cancelOutcome, HOUR, istDateString, istToUtc, needsSenior, pickCandidate, splitIntoSlots, weeklyRepeats, type Candidate } from "./scheduling";

const ist = (d: string, t: string) => istToUtc(d, t);

describe("splitIntoSlots", () => {
  it("splits 6-9 PM IST into three 1-hour slots on IST hour boundaries", () => {
    const s = splitIntoSlots(ist("2027-01-09", "18:00"), ist("2027-01-09", "21:00"));
    expect(s).toHaveLength(3);
    expect(s[0].startsAt).toEqual(ist("2027-01-09", "18:00"));
    expect(s[2].endsAt).toEqual(ist("2027-01-09", "21:00"));
    expect(s.every((x) => x.endsAt.getTime() - x.startsAt.getTime() === HOUR)).toBe(true);
  });
  it("floors partial hours: 6:00-8:45 gives two slots", () => {
    expect(splitIntoSlots(ist("2027-01-09", "18:00"), ist("2027-01-09", "20:45"))).toHaveLength(2);
  });
  it("aligns a 6:30 start up to 7:00", () => {
    const s = splitIntoSlots(ist("2027-01-09", "18:30"), ist("2027-01-09", "21:00"));
    expect(s[0].startsAt).toEqual(ist("2027-01-09", "19:00"));
    expect(s).toHaveLength(2);
  });
  it("returns nothing for windows shorter than an hour", () => {
    expect(splitIntoSlots(ist("2027-01-09", "18:00"), ist("2027-01-09", "18:59"))).toEqual([]);
  });
});

describe("IST helpers", () => {
  it("round-trips a date", () => expect(istDateString(ist("2027-01-09", "00:30"))).toBe("2027-01-09"));
  it("treats 11:45 PM IST as the same IST day", () => expect(istDateString(ist("2027-01-09", "23:45"))).toBe("2027-01-09"));
  it("repeats weekly up to and including the end date", () => {
    const r = weeklyRepeats(ist("2027-01-09", "18:00"), ist("2027-01-09", "21:00"), ist("2027-01-23", "18:00"));
    expect(r).toHaveLength(2);
  });
});

const c = (mentorId: string, tier: Candidate["tier"], load: number, isAdminMentor = false): Candidate => ({ slotId: `s-${mentorId}`, mentorId, tier, load, isAdminMentor });

describe("pickCandidate", () => {
  it("gives a senior-required session to a Senior, lowest load first", () => {
    expect(pickCandidate([c("j1", "JUNIOR", 0), c("s1", "SENIOR", 5), c("s2", "SENIOR", 2)], true)?.mentorId).toBe("s2");
  });
  it("never gives a senior-required session to a Junior", () => {
    expect(pickCandidate([c("j1", "JUNIOR", 0)], true)).toBeNull();
  });
  it("gives ordinary sessions to the least-loaded Junior", () => {
    expect(pickCandidate([c("j1", "JUNIOR", 4), c("j2", "JUNIOR", 1), c("s1", "SENIOR", 0)], false)?.mentorId).toBe("j2");
  });
  it("falls back to a Senior, then to the Admin's own availability", () => {
    expect(pickCandidate([c("s1", "SENIOR", 0), c("a", "SENIOR", 0, true)], false)?.mentorId).toBe("s1");
    expect(pickCandidate([c("a", "SENIOR", 0, true)], false)?.mentorId).toBe("a");
    expect(pickCandidate([c("a", "SENIOR", 0, true)], true)?.mentorId).toBe("a");
  });
  it("breaks load ties deterministically", () => {
    expect(pickCandidate([c("j2", "JUNIOR", 1), c("j1", "JUNIOR", 1)], false)?.mentorId).toBe("j1");
  });
  it("returns null when nobody is free", () => expect(pickCandidate([], false)).toBeNull());
});

describe("needsSenior", () => {
  const rule = ["STRESS", "INSTITUTE_FINAL"];
  it("applies to configured PI focuses only", () => {
    expect(needsSenior("MOCK_PI", "STRESS", rule)).toBe(true);
    expect(needsSenior("MOCK_PI", "HR_PROFILE", rule)).toBe(false);
    expect(needsSenior("GUIDANCE", "STRESS", rule)).toBe(false);
  });
});

describe("cancel and reschedule policy", () => {
  const start = ist("2027-01-09", "18:00");
  it("releases the credit with 12h+ notice", () => expect(cancelOutcome(start, new Date(start.getTime() - 13 * HOUR), 12)).toBe("RELEASE"));
  it("consumes the credit on a late cancel", () => expect(cancelOutcome(start, new Date(start.getTime() - 11 * HOUR), 12)).toBe("CONSUME"));
  it("allows a reschedule within notice and limit only", () => {
    const early = new Date(start.getTime() - 24 * HOUR);
    expect(canReschedule(start, early, 12, 1, 2)).toBe(true);
    expect(canReschedule(start, early, 12, 2, 2)).toBe(false);
    expect(canReschedule(start, new Date(start.getTime() - 2 * HOUR), 12, 0, 2)).toBe(false);
  });
});
