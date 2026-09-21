"use client";

import { usePathname } from "next/navigation";
import { portals, resolveScreen, type PortalRole } from "@/lib/portal-nav";

/**
 * Sticky top bar shared by all three portals. The title and sub-title come from the nav config for the
 * current path; `titleOverrides` lets a screen show data-driven text (e.g. "Hi Ananya"). `children` is the
 * server-rendered right-hand cluster (countdown pill, avatar, sign out).
 */
export function PortalTopbar({
  role,
  titleOverrides,
  children,
}: {
  role: PortalRole;
  titleOverrides?: Record<string, { title?: string; sub?: string }>;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const screen = resolveScreen(portals[role], pathname);
  const o = titleOverrides?.[pathname.replace(/\/+$/, "")] ?? {};
  const title = o.title ?? screen?.title ?? "";
  const sub = o.sub ?? screen?.sub;
  const admin = role === "admin";

  return (
    <header className="sticky top-0 z-[5] flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-[13px]">
      <div className="min-w-0 flex-[1_1_200px]">
        {admin && sub && <p className="type-label mb-1 text-ink-faint">{sub}</p>}
        <h1 className="font-display text-[19px] font-bold leading-[1.2] text-ink">{title}</h1>
        {!admin && sub && <p className="mt-[3px] text-xs leading-[1.3] text-ink-faint">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </header>
  );
}
