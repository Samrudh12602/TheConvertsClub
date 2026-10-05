import { describe, expect, it } from "vitest";
import { REQUIRED_DOCS } from "./legal";
import { buildLegalDocs } from "./legal-text";

const policy = { refundWindowHours: 48, recordingRetentionDays: 90, cancelNoticeHours: 12, maxReschedules: 2, feedbackDueHours: 24, referralBonusEvery: 10, referralBonusPercent: 5 };
const docs = buildLegalDocs(policy);
const text = (k: keyof typeof docs) => JSON.stringify(docs[k]);

describe("legal documents", () => {
  it("has every document a user can be asked to accept", () => {
    for (const keys of Object.values(REQUIRED_DOCS)) for (const k of keys) expect(docs[k]).toBeDefined();
  });
  it("never leaks a template hole or an undefined", () => {
    for (const d of Object.values(docs)) {
      expect(JSON.stringify(d)).not.toMatch(/undefined|\$\{|\{\w+\}/);
      expect(d.sections.length).toBeGreaterThan(3);
      for (const s of d.sections) expect(s.items.length).toBeGreaterThan(0);
    }
  });
  it("states the live policy numbers, so the text can't contradict the product", () => {
    expect(text("refunds")).toContain("48 hours");
    expect(text("terms")).toContain("12 hours");
    expect(text("terms")).toContain("90 days");
    expect(text("mentor-agreement")).toContain("24 hours");
    expect(text("mentor-agreement")).toContain("every 10 students");
    expect(text("mentor-agreement")).toContain("5% of the fees");
    expect(buildLegalDocs({ ...policy, refundWindowHours: 72 }).refunds.sections[0].items[0]).toContain("72 hours");
  });
  it("covers the protections both sides need", () => {
    const t = text("terms");
    for (const phrase of ["Governing law", "Arbitration and Conciliation Act", "Grievance", "Limits on our liability", "Consumer Protection Act", "do not guarantee admission"]) {
      expect(t.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(text("privacy")).toContain("Digital Personal Data Protection Act");
    const m = text("mentor-agreement");
    for (const phrase of ["independent contractor", "confidential", "tax", "ending"]) expect(m.toLowerCase()).toContain(phrase);
  });
});
