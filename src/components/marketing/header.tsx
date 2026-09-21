"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/packages", label: "Packages" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/mentors", label: "Mentors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === item.href ? "text-brand" : "text-ink hover:bg-sunken"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-ink px-3.5 py-2 hover:text-brand">
            Log in
          </Link>
          <Button size="sm" onClick={() => router.push("/packages" as never)}>
            See packages
          </Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-hairline bg-canvas px-4 py-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-[var(--radius-sm)] px-3 py-3 text-sm font-medium text-ink hover:bg-sunken"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-hairline flex flex-col gap-2">
            <Link href="/login" className="w-full text-center rounded-[var(--radius-md)] border border-border-strong py-2.5 text-sm font-semibold text-ink">
              Log in
            </Link>
            <Button onClick={() => router.push("/packages" as never)}>See packages</Button>
          </div>
        </div>
      )}
    </header>
  );
}
