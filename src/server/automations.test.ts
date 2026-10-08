import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings-db", () => ({ getSettings: async () => ({}) }));
import { feedbackStage } from "./automations";

describe("feedback chaser stages", () => {
  it("stays quiet in the first 12 hours", () => {
    expect(feedbackStage(0, 24)).toBe("none");
    expect(feedbackStage(11.9, 24)).toBe("none");
  });
  it("nudges from 12 hours until the due time", () => {
    expect(feedbackStage(12, 24)).toBe("nudge");
    expect(feedbackStage(23.9, 24)).toBe("nudge");
  });
  it("goes firm at the due time and escalates a day later", () => {
    expect(feedbackStage(24, 24)).toBe("late");
    expect(feedbackStage(47.9, 24)).toBe("late");
    expect(feedbackStage(48, 24)).toBe("esc");
  });
  it("follows a shorter or longer due window", () => {
    expect(feedbackStage(13, 12)).toBe("late");
    expect(feedbackStage(40, 48)).toBe("nudge");
  });
});
