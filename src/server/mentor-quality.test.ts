import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { qualityFlags } from "./mentor-quality";

const base = { ratingAvg: 4.6, ratings: 10, feedbackTotal: 10, feedbackOnTime: 10, overdueNow: 0 };

describe("qualityFlags", () => {
  it("flags nothing for a healthy mentor", () => expect(qualityFlags(base)).toEqual([]));
  it("flags a low rating only once there are enough ratings", () => {
    expect(qualityFlags({ ...base, ratingAvg: 3.0 })).toEqual(["Low rating"]);
    expect(qualityFlags({ ...base, ratingAvg: 2.0, ratings: 2 })).toEqual([]);
  });
  it("flags habitually late feedback, but not one slip", () => {
    expect(qualityFlags({ ...base, feedbackOnTime: 6 })).toEqual(["Late feedback"]);
    expect(qualityFlags({ ...base, feedbackTotal: 2, feedbackOnTime: 0 })).toEqual([]);
  });
  it("always flags feedback that is overdue right now", () => expect(qualityFlags({ ...base, overdueNow: 2 })).toEqual(["Feedback overdue"]));
});
