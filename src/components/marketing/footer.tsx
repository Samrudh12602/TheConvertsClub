import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/packages", label: "Packages" },
      { href: "/services", label: "Services" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/mentors", label: "Mentors" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/results", label: "Results" },
      { href: "/faq", label: "FAQ" },
      { href: "/become-a-mentor", label: "Become a mentor" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/refund", label: "Refund policy" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-sunken/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              You got the call. Now let&apos;s convert it. Student-led GDPI preparation for MBA aspirants.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink hover:text-brand">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-hairline pt-6">
          <p className="text-xs text-muted">© 2026 The Convert Club. All rights reserved.</p>
          <p className="text-xs text-muted">No lectures. No CAT coaching. No unnecessary packages.</p>
        </div>
      </div>
    </footer>
  );
}
