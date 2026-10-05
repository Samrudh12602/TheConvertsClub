import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { checkRecordingUrl, FeedbackError } from "./feedback";

describe("checkRecordingUrl (the proof a session took place)", () => {
  it("accepts an ordinary https link and trims it", () => {
    expect(checkRecordingUrl("  https://drive.google.com/file/d/abc123/view  ")).toBe("https://drive.google.com/file/d/abc123/view");
    expect(checkRecordingUrl("https://us02web.zoom.us/rec/share/xyz?pwd=1")).toContain("zoom.us");
  });
  it("treats blank as 'no link' (the caller decides whether that's allowed)", () => {
    expect(checkRecordingUrl("")).toBeNull();
    expect(checkRecordingUrl(undefined)).toBeNull();
  });
  it("rejects anything that isn't a proper public https link", () => {
    for (const bad of ["drive.google.com/file", "http://example.com/rec", "https://localhost/rec", "https://192.168.1.5/rec", "https://intranet/rec", "javascript:alert(1)", "not a link"]) {
      expect(() => checkRecordingUrl(bad), bad).toThrow(FeedbackError);
    }
  });
  it("rejects an absurdly long link", () => expect(() => checkRecordingUrl("https://example.com/" + "a".repeat(600))).toThrow(FeedbackError));
});
