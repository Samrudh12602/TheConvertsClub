import { getSettings } from "@/lib/settings-db";
import { isSnapSlug } from "@/server/student-kind";

/** True while the GDPI prep offering is shown as "coming soon" (Admin > Settings > Public site). */
export async function gdpiComingSoon(): Promise<boolean> {
  return Boolean((await getSettings()).gdpiComingSoon);
}

/** Whether a product may be sold right now: SNAP mock products always, everything else only once GDPI prep is switched on. */
export async function isSellable(slug: string): Promise<boolean> {
  return isSnapSlug(slug) || !(await gdpiComingSoon());
}
