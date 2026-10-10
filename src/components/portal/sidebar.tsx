"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { NavGroup, PortalRole } from "@/lib/portal-nav";
import { NavIcon } from "@/components/portal/nav-icons";
import { LogoMark } from "@/components/brand/logo-mark";

const BRAND: Record<PortalRole, { sub: string | null }> = {
  student: { sub: null },
  mentor: { sub: "Mentor" },
  admin: { sub: "Admin console" },
};

function isActive(pathname: string, href: string, match: string[] = []) {
  const base = href.split("?")[0];
  const root = base.split("/").length === 2; // "/student", "/mentor", "/admin"
  if (root) return pathname === base;
  return pathname === base || pathname.startsWith(base + "/") || match.some((m) => pathname.startsWith(m));
}

/**
 * Light sidebar for student/mentor, dark for admin. On phones it collapses behind a Menu button
 * (the design's sidebar simply wraps above the content, which pushes the page down the screen).
 * `footer` is a server-rendered slot for the credits box (student) or tier box (mentor).
 */
export function PortalSidebar({ role, groups, footer }: { role: PortalRole; groups: NavGroup[]; footer?: React.ReactNode }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const dark = role === "admin";
  const brand = BRAND[role];

  return (
    <aside
      className={clsx(
        "md:sticky md:top-0 md:flex md:h-screen md:w-[232px] md:flex-none md:flex-col md:overflow-y-auto",
        dark ? "bg-night text-dark-text" : "border-b border-line bg-surface md:border-b-0 md:border-r md:shadow-[1px_0_0_rgba(60,35,10,0.03),6px_0_24px_rgba(60,35,10,0.04)]",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3 md:px-5 md:pb-4 md:pt-5">
        <Link href={`/${role}`} className="flex items-center gap-[9px] no-underline hover:no-underline" aria-label={`Converts Club ${role} home`}>
          <LogoMark tone={dark ? "paper" : "color"} className="h-7 w-auto flex-none" />
          <span className="min-w-0">
            <span className={clsx("block font-display text-[13px] font-bold leading-[1.15]", dark ? "text-surface" : "text-ink")}>Converts Club</span>
            {brand.sub && (
              <span className={clsx("block text-[10px] font-semibold uppercase leading-[1.3] tracking-[0.1em]", dark ? "text-dark-muted" : "text-ink-faint")}>
                {brand.sub}
              </span>
            )}
          </span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${role}-nav`}
          onClick={() => setOpenAt(open ? null : pathname)}
          className={clsx(
            "inline-flex min-h-10 items-center rounded-lg border px-3 text-[12.5px] font-medium md:hidden",
            dark ? "border-dark-line bg-transparent text-dark-text" : "border-line-strong bg-white text-ink-2",
          )}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div id={`${role}-nav`} className={clsx("flex-1 flex-col px-3 pb-5 md:flex", open ? "flex" : "hidden")}>
        <nav aria-label={`${role} navigation`} className="flex flex-1 flex-col gap-3.5">
          {groups.map((g, gi) => (
            <div key={g.label ?? gi}>
              {g.label && <p className="px-2 pb-[7px] text-[10px] font-semibold uppercase leading-none tracking-[0.11em] text-dark-muted">{g.label}</p>}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((it) => {
                  const active = isActive(pathname, it.href, it.match);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "group relative flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 leading-[1.2] no-underline transition-all duration-150 hover:no-underline",
                          dark
                            ? clsx("text-[12.5px] font-medium", active ? "bg-white/[0.08] text-surface shadow-inset" : "text-dark-soft hover:bg-white/[0.05] hover:text-surface")
                            : clsx("text-[13px]", active ? "bg-white font-semibold text-ink shadow-card ring-1 ring-line" : it.lock ? "font-normal text-ink-faint hover:bg-white/70 hover:text-ink-muted" : "font-normal text-ink-muted hover:bg-white/70 hover:text-ink"),
                        )}
                      >
                        {active && <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-oxblood shadow-[0_0_10px_rgba(147,40,54,0.7)]" />}
                        <NavIcon href={it.iconHref ?? it.href} className={clsx("size-[17px] flex-none transition-colors", active ? (dark ? "text-[#e7a0a8]" : "text-oxblood") : "opacity-75 group-hover:opacity-100")} />
                        <span className="min-w-0 flex-1 truncate">{it.label}</span>
                        {it.lock && <span className={clsx("flex-none rounded-full px-1.5 py-[3px] text-[9.5px] font-semibold leading-none", dark ? "bg-white/10 text-dark-muted" : "bg-line-soft text-ink-faint")}>{it.lock === "soon" ? "Soon" : "Locked"}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {footer}
      </div>
    </aside>
  );
}
