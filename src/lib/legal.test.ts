import { describe, expect, it } from "vitest";
import { LEGAL_VERSION, listLabels, missingDocs, requiredDocsFor } from "./legal";

const all = (docs: string[], version = LEGAL_VERSION) => docs.map((document) => ({ document, version }));

describe("missingDocs", () => {
  it("asks a new student for the three student documents", () => {
    expect(missingDocs("STUDENT", [])).toEqual(["terms", "privacy", "refunds"]);
  });
  it("asks a new mentor for the mentor agreement as well", () => {
    expect(missingDocs("MENTOR", [])).toEqual(["mentor-agreement", "terms", "privacy"]);
  });
  it("is satisfied once everything is accepted at the current version", () => {
    expect(missingDocs("STUDENT", all(["terms", "privacy", "refunds"]))).toEqual([]);
  });
  it("asks again when the version has moved on", () => {
    expect(missingDocs("STUDENT", all(["terms", "privacy", "refunds"], "2020-01-01"))).toHaveLength(3);
  });
  it("asks only for what is outstanding", () => {
    expect(missingDocs("STUDENT", all(["terms"]))).toEqual(["privacy", "refunds"]);
  });
  it("never blocks an admin", () => {
    expect(requiredDocsFor("ADMIN")).toBeNull();
    expect(missingDocs("ADMIN", [])).toEqual([]);
  });
});

describe("listLabels", () => {
  it("joins labels in plain English", () => {
    expect(listLabels(["terms", "privacy", "refunds"])).toBe("Terms of Use, Privacy Policy and Refund Policy");
    expect(listLabels(["terms"])).toBe("Terms of Use");
  });
});
