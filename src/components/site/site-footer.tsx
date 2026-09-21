import Link from "next/link";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/mentors", label: "Mentors" },
  { href: "/become-a-mentor", label: "Become a mentor" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
  { href: "/login", label: "Log in" },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 bg-ink px-5 py-8">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-6">
        <div className="flex-[1_1_220px]">
          <div className="font-display text-[15px] font-bold leading-tight text-surface">The Convert Club</div>
          <p className="mt-[9px] max-w-[38ch] text-[12.5px] leading-[1.65] text-dark-muted">
            GDPI prep run by people who converted last season. convertsclub.in
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-1.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-[34px] items-center rounded-md px-[9px] text-[12.5px] leading-none text-dark-soft no-underline hover:text-surface hover:no-underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
