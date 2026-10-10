"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";
import { PORTAL_LABEL, type RoleName } from "@/lib/roles";

const NAV_SOON = [
  { href: "/", label: "Home" },
  { href: "/mocks", label: "SNAP Mocks" },
  { href: "/packages", label: "GDPI prep · soon" },
  { href: "/contact", label: "Contact" },
  { href: "/become-a-mentor", label: "Become a mentor" },
];

const NAV = [
  { href: "/", label: "Home" },
  { href: "/mocks", label: "SNAP Mocks" },
  { href: "/packages", label: "Packages" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/mentors", label: "Mentors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/become-a-mentor", label: "Become a mentor" },
];

export function SiteHeader({ account, comingSoon = false }: { account: { role: RoleName; home: string } | null; comingSoon?: boolean }) {
  const pathname = usePathname();
  // The menu is "open" only for the page it was opened on, so navigating closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  const links = (comingSoon ? NAV_SOON : NAV).map((n) => {
    const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
    return (
      <Link
        key={n.href}
        href={n.href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "relative whitespace-nowrap rounded-[7px] px-[11px] py-2.5 text-[12.5px] leading-none no-underline transition-colors hover:bg-line-soft hover:no-underline lg:min-h-9",
          active ? "bg-white font-semibold text-ink shadow-card ring-1 ring-line" : "font-normal text-ink-muted hover:text-ink",
        )}
      >
        {n.label}
      </Link>
    );
  });

  return (
    <header className="glass sticky top-0 z-20 border-b border-line shadow-xs">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-5 py-3">
        <Link href="/" className="mr-1.5 flex items-center gap-[9px] no-underline hover:no-underline" aria-label="The Converts Club, home">
          <span aria-hidden className="flex size-[28px] items-center justify-center rounded-lg bg-brand font-display text-[14px] font-bold leading-none text-white shadow-glow">
            C
          </span>
          <span className="font-display text-sm font-bold leading-tight text-ink">The Converts Club</span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 flex-nowrap gap-0.5 lg:flex">
          {links}
        </nav>

        <div className="ml-auto flex gap-2 lg:ml-0">
          <ButtonLink href={account ? account.home : "/login"} variant="secondary" size="sm" className="hidden sm:inline-flex">
            {account ? PORTAL_LABEL[account.role] : "Log in"}
          </ButtonLink>
          <ButtonLink href={comingSoon ? "/mocks" : "/packages"} size="sm" data-track="header_cta">
            {comingSoon ? "SNAP mocks" : "See packages"}
          </ButtonLink>
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-lg border border-line-strong bg-white px-3 text-[12.5px] font-medium text-ink-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="flex animate-fade-up flex-col gap-0.5 border-t border-line px-5 py-3 lg:hidden">
          {links}
          <Link href={account ? account.home : "/login"} className="rounded-[7px] px-[11px] py-2.5 text-[12.5px] leading-none text-ink-muted no-underline sm:hidden">
            {account ? PORTAL_LABEL[account.role] : "Log in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
