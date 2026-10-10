import { describe, expect, it } from "vitest";
import { basicsSchema, documentSchema, mentorAboutSchema, studentBackgroundSchema, studentCompleteness } from "./profile";

const empty = { dob: "", state: "", examsAppearing: [] as string[] };

describe("student background validation", () => {
  it("accepts an empty profile and a full one", () => {
    expect(studentBackgroundSchema.safeParse(empty).success).toBe(true);
    const full = studentBackgroundSchema.parse({ ...empty, dob: "2002-05-14", state: "Goa", city: "Panaji", examsAppearing: ["CAT", "SNAP"], tenthBoard: "CBSE", tenthPercent: "92.5", tenthYear: 2018, twelfthPercent: 88, twelfthYear: "2020", college: "Goa University", degree: "B.Com", gradYear: 2023, gradScore: "8.1 CGPA", workExMonths: "18", company: "Infosys", jobRole: "Analyst", about: "Hello" });
    expect(full.dob?.toISOString()).toBe("2002-05-14T00:00:00.000Z");
    expect(full.tenthPercent).toBe(92.5);
    expect(full.workExMonths).toBe(18);
    expect(full.examsAppearing).toEqual(["CAT", "SNAP"]);
  });
  it("rejects a percentage over 100, a silly year, a bad state and an impossible age", () => {
    expect(studentBackgroundSchema.safeParse({ ...empty, tenthPercent: 120 }).success).toBe(false);
    expect(studentBackgroundSchema.safeParse({ ...empty, twelfthYear: 1960 }).success).toBe(false);
    expect(studentBackgroundSchema.safeParse({ ...empty, state: "Narnia" }).success).toBe(false);
    expect(studentBackgroundSchema.safeParse({ ...empty, dob: "2020-01-01" }).success).toBe(false);
    expect(studentBackgroundSchema.safeParse({ ...empty, dob: "not a date" }).success).toBe(false);
    expect(studentBackgroundSchema.safeParse({ ...empty, workExMonths: -3 }).success).toBe(false);
  });
});

describe("basics and documents", () => {
  it("normalises an Indian mobile number and allows a blank one", () => {
    expect(basicsSchema.parse({ name: "Ananya Nair", phone: "+91 98765 43210" }).phone).toBe("9876543210");
    expect(basicsSchema.parse({ name: "Ananya Nair", phone: "" }).phone).toBeNull();
    expect(basicsSchema.safeParse({ name: "A", phone: "" }).success).toBe(false);
    expect(basicsSchema.safeParse({ name: "Ananya", phone: "12345" }).success).toBe(false);
  });
  it("needs a title for a document", () => {
    expect(documentSchema.safeParse({ kind: "EXAM_RESULT", title: "CAT 2025", year: 2025, score: "98.4 percentile" }).success).toBe(true);
    expect(documentSchema.safeParse({ kind: "CALL_LETTER", title: "" }).success).toBe(false);
    expect(documentSchema.safeParse({ kind: "NOPE", title: "IIM A" }).success).toBe(false);
  });
  it("lets a mentor list the institutes they converted", () => {
    expect(mentorAboutSchema.parse({ convertedInstitutes: ["IIM Calcutta", "XLRI"], examScores: "CAT 99.2", company: "", jobRole: "" }).company).toBeNull();
  });
});

describe("profile completeness", () => {
  it("starts at zero, counts each answered part, and treats 0 months of work as an answer", () => {
    expect(studentCompleteness(null, 0, false)).toMatchObject({ pct: 0 });
    const half = studentCompleteness({ dob: new Date(), state: "Goa", examsAppearing: ["CAT"], workExMonths: 0 }, 0, true);
    expect(half.pct).toBe(Math.round((5 / 9) * 100));
    expect(half.missing).toContain("a few lines about you");
    expect(studentCompleteness({ dob: new Date(), state: "Goa", examsAppearing: ["CAT"], tenthPercent: 90, college: "X", workExMonths: 6, about: "hi" }, 1, true).pct).toBe(100);
  });
});
