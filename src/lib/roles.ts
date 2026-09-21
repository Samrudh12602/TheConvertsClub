export type RoleName = "STUDENT" | "MENTOR" | "ADMIN";

export const roleHome = (role: RoleName | undefined | null): string =>
  role === "ADMIN" ? "/admin" : role === "MENTOR" ? "/mentor" : role === "STUDENT" ? "/student" : "/login";

/** Only same-site relative paths are allowed as post-login destinations (no open redirects). */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

/** Demo accounts: fake addresses on a reserved TLD, so no mail can ever reach a real inbox. */
export const DEMO_ACCOUNTS: { role: RoleName; email: string; name: string; env: string }[] = [
  { role: "STUDENT", email: "student@demo.convertclub.test", name: "Ananya Nair (demo)", env: "DEMO_PASSCODE_STUDENT" },
  { role: "MENTOR", email: "mentor@demo.convertclub.test", name: "Rohit Kulkarni (demo)", env: "DEMO_PASSCODE_MENTOR" },
  { role: "ADMIN", email: "admin@demo.convertclub.test", name: "Samrudh (demo admin)", env: "DEMO_PASSCODE_ADMIN" },
];
