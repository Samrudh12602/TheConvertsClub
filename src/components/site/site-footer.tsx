import Link from "next/link";
import { PORTAL_LABEL, type RoleName } from "@/lib/roles";

const GROUPS = [
  { title: "Prepare", links: [{ href: "/packages", label: "Packages" }, { href: "/how-it-works", label: "How it works" }, { href: "/mentors", label: "Mentors" }, { href: "/free-guide", label: "Free checklist" }, { href: "/faq", label: "FAQ" }] },
  { title: "Company", links: [{ href: "/become-a-mentor", label: "Become a mentor" }, { href: "/contact", label: "Contact" }] },
  { title: "Legal", links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/refunds", label: "Refunds" }, { href: "/mentor-agreement", label: "Mentor Agreement" }] },
];

export function SiteFooter({ account }: { account: { role: RoleName; home: string } | null }) {
  const last = account ? { href: account.home, label: PORTAL_LABEL[account.role] } : { href: "/login", label: "Log in" };
  const link = "block py-1.5 text-[13px] leading-none text-dark-soft no-underline transition-colors hover:text-surface hover:no-underline";
  return (
    <footer className="relative mt-12 overflow-hidden bg-night px-5 pb-8 pt-12">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="mx-auto grid max-w-[1120px] gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex size-[30px] items-center justify-center rounded-lg bg-brand font-display text-[15px] font-bold leading-none text-white shadow-glow">C</span>
            <span className="font-display text-base font-bold leading-tight text-surface">The Convert Club</span>
          </div>
          <p className="mt-3.5 max-w-[34ch] text-[13px] leading-[1.7] text-dark-muted">
            GDPI prep run by people who converted last season. Real mocks, honest feedback, prices in the open.
          </p>
          <Link href={last.href} className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-[12.5px] font-semibold text-surface no-underline transition-colors hover:bg-white/[0.09] hover:no-underline">{last.label} →</Link>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="type-label mb-2.5 text-dark-muted">{g.title}</p>
            {g.links.map((l) => <Link key={l.href} href={l.href} className={link}>{l.label}</Link>)}
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-[1120px] border-t border-white/10 pt-5 text-[12px] leading-[1.6] text-dark-muted">
        © {new Date().getFullYear()} The Convert Club. Practice and feedback only: we don&apos;t promise admission, and we&apos;re not affiliated with any institute.
      </p>
    </footer>
  );
}
