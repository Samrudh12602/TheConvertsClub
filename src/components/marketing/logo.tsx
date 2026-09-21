import Link from "next/link";

export function Logo({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 shrink-0">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[10px] font-display text-base font-bold"
        style={{ background: "var(--gold-500)", color: "var(--navy-950)" }}
      >
        C
      </span>
      <span className={`font-display text-[17px] font-semibold leading-none ${inverse ? "text-white" : "text-ink"}`}>
        The Convert Club
      </span>
    </Link>
  );
}
