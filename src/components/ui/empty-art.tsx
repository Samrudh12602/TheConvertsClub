import clsx from "clsx";

type Art = "inbox" | "calendar" | "chart" | "sessions" | "search";

/**
 * Small friendly illustrations for empty screens, drawn with the theme tokens so they match both light and dark.
 * Decorative only (aria-hidden): the sentence next to them says what is empty.
 */
export function EmptyArt({ art = "inbox", className }: { art?: Art; className?: string }) {
  return (
    <svg viewBox="0 0 120 96" aria-hidden className={clsx("h-[84px] w-[104px]", className)} fill="none">
      <ellipse cx="60" cy="86" rx="40" ry="6" fill="var(--color-line-soft)" />
      {art === "inbox" && (
        <>
          <rect x="20" y="34" width="80" height="46" rx="10" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <path d="M20 58h26l5 8h18l5-8h26" stroke="var(--color-line-strong)" strokeWidth="2" strokeLinejoin="round" />
          <rect x="38" y="16" width="44" height="30" rx="6" fill="var(--color-oxblood-tint)" stroke="var(--color-oxblood-line)" strokeWidth="2" />
          <path d="M46 26h28M46 33h18" stroke="var(--color-oxblood)" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {art === "calendar" && (
        <>
          <rect x="24" y="20" width="72" height="60" rx="10" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <path d="M24 38h72" stroke="var(--color-line-strong)" strokeWidth="2" />
          <rect x="38" y="12" width="6" height="14" rx="3" fill="var(--color-oxblood)" />
          <rect x="76" y="12" width="6" height="14" rx="3" fill="var(--color-oxblood)" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={36 + (i % 3) * 20} y={46 + Math.floor(i / 3) * 14} width="12" height="8" rx="3" fill={i === 4 ? "var(--color-teal)" : "var(--color-line-soft)"} />)}
        </>
      )}
      {art === "chart" && (
        <>
          <rect x="22" y="18" width="76" height="62" rx="10" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <rect x="34" y="52" width="10" height="20" rx="3" fill="var(--color-gold-line)" />
          <rect x="52" y="42" width="10" height="30" rx="3" fill="var(--color-teal-line)" />
          <rect x="70" y="30" width="10" height="42" rx="3" fill="var(--color-oxblood-line)" />
          <path d="M34 44l18-10 18 4 14-14" stroke="var(--color-oxblood)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5" />
        </>
      )}
      {art === "sessions" && (
        <>
          <rect x="18" y="24" width="64" height="42" rx="9" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="2" />
          <path d="M82 40l20-9v28l-20-9z" fill="var(--color-oxblood-tint)" stroke="var(--color-oxblood-line)" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="50" cy="42" r="8" fill="var(--color-teal-tint)" stroke="var(--color-teal-line)" strokeWidth="2" />
          <path d="M34 62c2-8 8-10 16-10s14 2 16 10" stroke="var(--color-teal-line)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {art === "search" && (
        <>
          <circle cx="54" cy="44" r="20" fill="var(--color-card)" stroke="var(--color-line-strong)" strokeWidth="3" />
          <path d="M69 59l18 18" stroke="var(--color-oxblood)" strokeWidth="5" strokeLinecap="round" />
          <path d="M44 44h20" stroke="var(--color-line-strong)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
