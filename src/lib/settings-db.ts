import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

/** Setting rows (Admin-editable) merged over the defaults. Cached for a minute; Admin saves revalidate "settings". */
const load = unstable_cache(
  async (): Promise<Settings> => {
    const rows = await db.setting.findMany();
    const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const r of rows) if (r.key in DEFAULT_SETTINGS) merged[r.key] = r.value;
    return merged as Settings;
  },
  ["settings"],
  { tags: ["settings"], revalidate: 60 },
);

export const getSettings = load;
/** Public pages read policy numbers through this. */
export const getPolicy = load;
