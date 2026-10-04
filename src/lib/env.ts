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

/**
 * Public base URL. Prefers an explicit NEXT_PUBLIC_APP_URL (set this once the custom domain is
 * actually live). Otherwise falls back to Vercel's own auto-injected production URL, which is
 * always correct for whatever domain is *actually* connected right now — never hardcode a domain
 * here, since a wrong one silently breaks every email link, canonical URL and sitemap entry.
 */
export const appUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
};
