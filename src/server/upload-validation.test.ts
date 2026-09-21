import { describe, expect, it } from "vitest";
import { sniff } from "./upload-validation";

const bytes = (...codes: number[]) => new Uint8Array([...codes, 120, 120, 120, 120]);
const PDF = [0x25, 0x50, 0x44, 0x46];
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const HTML = [0x3c, 0x68, 0x74, 0x6d];

describe("upload validation", () => {
  it("accepts a real PDF and DOCX signature", () => {
    expect(sniff("sop.pdf", bytes(...PDF)).mime).toBe("application/pdf");
    expect(sniff("sop.DOCX", bytes(...ZIP)).ext).toBe(".docx");
  });
  it("rejects other extensions", () => {
    expect(() => sniff("run.exe", bytes(0x4d, 0x5a))).toThrow();
    expect(() => sniff("notes.txt", bytes(104, 105))).toThrow();
  });
  it("rejects a file whose contents don't match its extension", () => {
    expect(() => sniff("evil.pdf", bytes(...HTML))).toThrow(/valid PDF/);
    expect(() => sniff("evil.docx", bytes(...PDF))).toThrow(/valid DOCX/);
  });
});
