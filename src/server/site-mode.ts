import type { Metadata } from "next";
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

/** Titles and descriptions of the GDPI-only public pages: neutral while they show "coming soon", so search and link previews don't advertise what can't be bought. */
export async function gatedMetadata(real: Metadata): Promise<Metadata> {
  if (!(await gdpiComingSoon())) return real;
  return { title: real.title, description: "Coming soon from The Convert Club. SNAP 2026 mocks are open now." };
}
