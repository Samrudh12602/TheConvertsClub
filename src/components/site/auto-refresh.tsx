"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the server component every few seconds (max ~1 minute) while a payment confirms. */
export function AutoRefresh({ everyMs = 3000, times = 20 }: { everyMs?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => { if (++n > times) clearInterval(t); else router.refresh(); }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, times]);
  return <p className="mt-5 text-xs text-ink-faint">Checking…</p>;
}
