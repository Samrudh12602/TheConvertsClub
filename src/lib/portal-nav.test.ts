import { describe, expect, it } from "vitest";
import { adminPortal, mentorPortal, resolveScreen, studentPortal } from "./portal-nav";

// Routes from the build spec, section 10.
const SPEC = {
  student: ["/student", "/student/onboarding", "/student/book", "/student/gd", "/student/sessions", "/student/sessions/abc", "/student/reviews", "/student/library", "/student/progress", "/student/calls", "/student/payments", "/student/settings", "/student/help"],
  mentor: ["/mentor", "/mentor/availability", "/mentor/sessions", "/mentor/sessions/abc", "/mentor/feedback/abc", "/mentor/reviews", "/mentor/earnings", "/mentor/messages", "/mentor/resources", "/mentor/profile"],
  admin: ["/admin", "/admin/students", "/admin/students/abc", "/admin/mentors", "/admin/mentors/abc", "/admin/applications", "/admin/scheduler", "/admin/sessions", "/admin/reviews", "/admin/payouts", "/admin/finance", "/admin/products", "/admin/analytics", "/admin/communications", "/admin/content", "/admin/settings", "/admin/audit"],
};

describe("every spec route has a portal screen", () => {
  it.each([
    ["student", studentPortal],
    ["mentor", mentorPortal],
    ["admin", adminPortal],
  ] as const)("%s", (role, config) => {
    for (const path of SPEC[role]) expect(resolveScreen(config, path), path).not.toBeNull();
  });

  it("returns null for unknown routes and other portals' routes", () => {
    expect(resolveScreen(studentPortal, "/student/nope")).toBeNull();
    expect(resolveScreen(studentPortal, "/admin/students")).toBeNull();
    expect(resolveScreen(mentorPortal, "/mentor/sessions/a/b")).toBeNull();
  });

  it("ignores trailing slashes", () => {
    expect(resolveScreen(studentPortal, "/student/book/")?.title).toBe("Book a session");
  });
});
