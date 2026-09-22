import { describe, expect, it } from "vitest";
import { sniff, sniffImage } from "./upload-validation";

const bytes = (...codes: number[]) => new Uint8Array([...codes, 120, 120, 120, 120]);
const PDF = [0x25, 0x50, 0x44, 0x46];
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const HTML = [0x3c, 0x68, 0x74, 0x6d];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const webpBytes = () => {
  const b = new Uint8Array(16);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  b.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
  return b;
};

describe("upload validation (documents)", () => {
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

describe("upload validation (photos)", () => {
  it("accepts a real JPEG, PNG and WEBP signature", () => {
    expect(sniffImage("photo.jpg", bytes(...JPEG)).mime).toBe("image/jpeg");
    expect(sniffImage("photo.jpeg", bytes(...JPEG)).ext).toBe(".jpg");
    expect(sniffImage("photo.PNG", new Uint8Array([...PNG, 1, 2, 3, 4])).mime).toBe("image/png");
    expect(sniffImage("photo.webp", webpBytes()).mime).toBe("image/webp");
  });
  it("rejects other extensions", () => {
    expect(() => sniffImage("photo.gif", bytes(0x47, 0x49, 0x46))).toThrow(/JPG, PNG or WEBP/);
    expect(() => sniffImage("script.svg", bytes(0x3c, 0x73))).toThrow();
  });
  it("rejects a file whose contents don't match its extension", () => {
    expect(() => sniffImage("evil.jpg", bytes(...PNG))).toThrow(/valid JPG/);
    expect(() => sniffImage("evil.png", bytes(...JPEG))).toThrow(/valid PNG/);
    expect(() => sniffImage("evil.webp", bytes(...JPEG))).toThrow(/valid WEBP/);
  });
});
