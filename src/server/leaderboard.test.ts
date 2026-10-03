import { vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { describe, expect, it } from "vitest";
import { rankBoard, shortName, type BoardEntry } from "./leaderboard";

const e = (name: string, mocks: number, rating: number | null = null): BoardEntry => ({ mentorId: name, name, mocks, rating, ratings: rating ? 3 : 0 });

describe("rankBoard", () => {
  it("orders by completed mocks", () => {
    expect(rankBoard([e("A", 2), e("B", 9), e("C", 5)]).map((r) => r.name)).toEqual(["B", "C", "A"]);
  });
  it("breaks ties on rating, then name", () => {
    expect(rankBoard([e("B", 4, 4.2), e("A", 4, 4.9), e("C", 4, 4.2)]).map((r) => r.name)).toEqual(["A", "B", "C"]);
  });
  it("gives genuinely equal scores the same rank", () => {
    const r = rankBoard([e("A", 4, 4.5), e("B", 4, 4.5), e("C", 1)]);
    expect(r.map((x) => x.rank)).toEqual([1, 1, 3]);
  });
});

describe("shortName", () => {
  it("shows first name and last initial, dropping the demo tag", () => {
    expect(shortName("Rohit Kulkarni (demo)")).toBe("Rohit K.");
    expect(shortName("Samrudh")).toBe("Samrudh");
    expect(shortName(null)).toBe("Mentor");
  });
});
