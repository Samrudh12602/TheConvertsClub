"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/mentors", label: "Mentors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/become-a-mentor", label: "Become a mentor" },
];

export function SiteHeader() {
  const pathname = usePathname();
  // The menu is "open" only for the page it was opened on, so navigating closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  const links = NAV.map((n) => {
    const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
    return (
      <Link
        key={n.href}
        href={n.href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "rounded-[7px] px-[11px] py-2.5 text-[12.5px] leading-none no-underline hover:bg-line-soft hover:no-underline md:min-h-9",
          active ? "bg-line-soft font-semibold text-ink" : "font-normal text-ink-muted hover:text-ink",
        )}
      >
        {n.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 px-5 py-3">
        <Link href="/" className="mr-1.5 flex items-center gap-[9px] no-underline hover:no-underline" aria-label="The Convert Club, home">
          <span aria-hidden className="flex size-[26px] items-center justify-center rounded-md bg-oxblood font-display text-[13px] font-bold leading-none text-white">
            C
          </span>
          <span className="font-display text-sm font-bold leading-tight text-ink">The Convert Club</span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 flex-wrap gap-0.5 md:flex">
          {links}
        </nav>

        <div className="ml-auto flex gap-2 md:ml-0">
          <ButtonLink href="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
            Log in
          </ButtonLink>
          <ButtonLink href="/packages" size="sm">
            See packages
          </ButtonLink>
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-lg border border-line-strong bg-white px-3 text-[12.5px] font-medium text-ink-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="flex flex-col gap-0.5 border-t border-line px-5 py-3 md:hidden">
          {links}
          <Link href="/login" className="rounded-[7px] px-[11px] py-2.5 text-[12.5px] leading-none text-ink-muted no-underline sm:hidden">
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
}
