/**
 * Which environment this build/runtime is serving.
 * APP_ENV wins, then Vercel's VERCEL_ENV, then NODE_ENV.
 * Demo content (fake mentors, placeholder results) is only ever shown outside "production".
 */
export type AppEnv = "production" | "preview" | "development";

export function appEnv(): AppEnv {
  const raw = process.env.APP_ENV ?? process.env.VERCEL_ENV;
  if (raw === "production" || raw === "preview" || raw === "development") return raw;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const isProductionEnv = (): boolean => appEnv() === "production";

export const appUrl = (): string =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://convertsclub.in").replace(/\/$/, "");

/**
 * Demo mode: the seeded demo accounts can sign in with a passcode and demo content (fake mentors, placeholder
 * results) is shown. Turn OFF (DEMO_LOGIN_ENABLED=false) and purge demo data before real launch.
 */
export const demoMode = (): boolean => process.env.DEMO_LOGIN_ENABLED === "true";

/** Demo content shows outside production, or anywhere demo mode is on. */
export const showDemoContent = (): boolean => !isProductionEnv() || demoMode();
