import { describe, expect, it } from "vitest";
import { checklistProgress, mentorChecklist } from "./mentor-checklist";

const none = { bio: null, photoKey: null, photoUrl: null, payoutEncrypted: null, futureOpenSlots: 0 };

describe("mentorChecklist", () => {
  it("starts with everything outstanding, availability first", () => {
    const c = mentorChecklist(none);
    expect(c.every((i) => !i.done)).toBe(true);
    expect(c[0].key).toBe("availability");
  });
  it("ticks items off as they are done", () => {
    const c = mentorChecklist({ bio: "IIM A, fresher convert", photoKey: "k", photoUrl: null, payoutEncrypted: "x", futureOpenSlots: 4 });
    expect(checklistProgress(c)).toEqual({ done: 4, total: 4 });
  });
  it("treats a blank bio as missing and an external photo URL as a photo", () => {
    const c = mentorChecklist({ ...none, bio: "   ", photoUrl: "https://x/y.jpg" });
    expect(c.find((i) => i.key === "bio")?.done).toBe(false);
    expect(c.find((i) => i.key === "photo")?.done).toBe(true);
  });
});
