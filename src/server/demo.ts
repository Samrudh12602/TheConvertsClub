import type { db } from "@/lib/db";
import { isProductionEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings-db";
import { scopedClient } from "@/server/demo-scope";
import { currentUser } from "@/server/session";

/**
 * Is demo mode on? The demo accounts, demo mentors on the public site, and demo rows in the admin portal all
 * follow this one switch. It lives in Admin > Settings ("Demo mode") and is OFF by default; the demo data itself
 * stays in the database. On a developer machine the env flag still turns it on so local work isn't blocked.
 */
export async function demoEnabled(): Promise<boolean> {
  if (!isProductionEnv() && process.env.DEMO_LOGIN_ENABLED === "true") return true;
  return Boolean((await getSettings()).demoEnabled);
}

/**
 * The database client the admin portal's list and total screens should use. A real admin sees real data only
 * while demo mode is off; turn demo mode on (or sign in as the demo admin) and everything shows, as before.
 * Reads only: writes and by-id lookups go through the normal client.
 */
export async function adminDb(): Promise<typeof db> {
  const [viewer, demo] = await Promise.all([currentUser(), demoEnabled()]);
  const realOnly = !(viewer?.isDemo || demo);
  return scopedClient(realOnly) as unknown as typeof db;
}
