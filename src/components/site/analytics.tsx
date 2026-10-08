"use client";

import { useEffect } from "react";
import { Analytics, track } from "@vercel/analytics/react";

/**
 * Cookie-free page analytics for the public site only (never the logged-in portals). Anything with a
 * `data-track="name"` attribute is counted when clicked, with no personal data attached: just the name.
 * Switch it on once in the Vercel dashboard (Analytics tab); until then this does nothing visible.
 */
export function SiteAnalytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      const name = el?.dataset.track;
      if (name) track(name);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return <Analytics />;
}
