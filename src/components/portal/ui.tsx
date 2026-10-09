import clsx from "clsx";
import { EmptyArt } from "@/components/ui/empty-art";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import type { Tone } from "@/lib/labels";

/** White panel with a bold header row, used for lists and tables across the portals. */
export function Panel({ title, action, children, className, flush = true }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={clsx("overflow-hidden rounded-xl border border-line bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-b from-card to-surface px-4 py-3">
          <h2 className="text-[13.5px] font-bold leading-none text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-3.5"}>{children}</div>
    </section>
  );
}

export function Row({ children, href, className }: { children: React.ReactNode; href?: string; className?: string }) {
  const cls = clsx("flex items-center gap-3 border-b border-line-soft px-3.5 py-3 transition-colors duration-150 last:border-b-0", href && "hover:bg-surface", className);
  return href ? <Link href={href} className={clsx(cls, "text-inherit no-underline hover:no-underline")}>{children}</Link> : <div className={cls}>{children}</div>;
}

const KPI_ACCENT = {
  oxblood: { bar: "from-oxblood to-oxblood-hover", glow: "bg-oxblood/10", icon: "bg-oxblood-tint text-oxblood" },
  teal: { bar: "from-teal to-[#2a8c83]", glow: "bg-teal/10", icon: "bg-teal-tint text-teal" },
  gold: { bar: "from-gold to-[#d4a04a]", glow: "bg-gold/12", icon: "bg-gold-tint text-gold-deep" },
  indigo: { bar: "from-indigo to-[#4a49a6]", glow: "bg-indigo/10", icon: "bg-indigo-tint text-indigo" },
  stone: { bar: "from-ink-faint to-ink-muted", glow: "bg-ink/5", icon: "bg-line-soft text-ink-2" },
} as const;

/** A headline number. The colour accent follows the note's tone (green = teal, amber = gold) unless one is given, so a row of KPIs is never one flat colour. */
export function Kpi({ label, value, note, noteTone = "muted", icon, accent }: { label: string; value: React.ReactNode; note?: React.ReactNode; noteTone?: "muted" | "green" | "oxblood" | "amber"; icon?: React.ReactNode; accent?: keyof typeof KPI_ACCENT }) {
  const tones = { muted: "text-ink-muted", green: "text-teal", oxblood: "text-oxblood", amber: "text-gold-deep" };
  const a = KPI_ACCENT[accent ?? ({ muted: "stone", green: "teal", oxblood: "oxblood", amber: "gold" } as const)[noteTone]];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-card px-4 py-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <span aria-hidden className={clsx("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", a.bar)} />
      <span aria-hidden className={clsx("pointer-events-none absolute -right-8 -top-8 size-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100", a.glow)} />
      <div className="relative flex items-start justify-between gap-2">
        <p className="type-label text-ink-faint">{label}</p>
        {icon && <span className={clsx("flex size-7 flex-none items-center justify-center rounded-lg [&>svg]:size-4", a.icon)}>{icon}</span>}
      </div>
      <p className="tnum relative mt-[10px] font-display text-[27px] font-bold leading-[1.1] text-ink">{value}</p>
      {note && <p className={clsx("relative mt-[6px] text-[11.5px] leading-[1.35]", tones[noteTone])}>{note}</p>}
    </div>
  );
}

export function KpiGrid({ children, min = 168 }: { children: React.ReactNode; min?: number }) {
  return <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>{children}</div>;
}

const meterTone: Record<string, string> = { green: "bg-gradient-to-r from-teal to-[#2a8c83]", amber: "bg-gradient-to-r from-gold to-[#d4a04a]", oxblood: "bg-gradient-to-r from-oxblood to-oxblood-hover", indigo: "bg-gradient-to-r from-indigo to-[#4a49a6]", stone: "bg-ink-faint" };

export function Meter({ pct, tone = "oxblood", label, note }: { pct: number; tone?: keyof typeof meterTone; label?: string; note?: string }) {
  return (
    <div>
      {(label || note) && (
        <div className="flex justify-between gap-2 text-xs font-medium leading-[1.2] text-ink-2">
          <span>{label}</span>
          <span className="tnum text-ink-faint">{note}</span>
        </div>
      )}
      <div className={clsx("h-2 overflow-hidden rounded-full bg-line-soft", (label || note) && "mt-1.5")} role="img" aria-label={`${Math.round(pct)} percent`}>
        <div className={clsx("h-full rounded transition-[width] duration-1000 ease-out", meterTone[tone])} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <Pill tone={tone} className="flex-none whitespace-nowrap">{children}</Pill>;
}

export function DateBadge({ day, mon, w = "w-11" }: { day: string; mon: string; w?: string }) {
  return (
    <div className={clsx("flex-none text-center", w)}>
      <p className="font-display text-[15px] font-bold leading-none text-ink">{day}</p>
      <p className="mt-[3px] text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-ink-faint">{mon}</p>
    </div>
  );
}

export function Empty({ children, art = "inbox" }: { children: React.ReactNode; art?: "inbox" | "calendar" | "chart" | "sessions" | "search" }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3.5 py-8 text-center">
      <EmptyArt art={art} />
      <p className="max-w-[44ch] text-[13px] leading-normal text-ink-faint">{children}</p>
    </div>
  );
}

/** Coloured-edge insight card (feedback blocks, progress notes, messages). */
export function Insight({ title, tone, icon, children }: { title: string; tone: "green" | "oxblood" | "amber" | "indigo" | "stone"; icon?: React.ReactNode; children: React.ReactNode }) {
  const edge: Record<string, string> = { green: "border-l-green text-green", oxblood: "border-l-oxblood text-oxblood", amber: "border-l-amber text-amber", indigo: "border-l-indigo text-indigo", stone: "border-l-ink-muted text-ink-muted" };
  return (
    <div className={clsx("rounded-xl border border-line border-l-[3px] bg-card p-[15px] shadow-card", edge[tone].split(" ")[0])}>
      <p className={clsx("type-label flex items-center gap-1.5 [&>svg]:size-3.5", edge[tone].split(" ")[1])}>{icon}{title}</p>
      <div className="mt-[9px] flex flex-col gap-[9px] text-[13px] leading-[1.55] text-ink-body">{children}</div>
    </div>
  );
}

export function Section({ children, cols = 260 }: { children: React.ReactNode; cols?: number }) {
  return <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${cols}px, 100%), 1fr))` }}>{children}</div>;
}

export function Flash({ tone = "amber", children }: { tone?: "amber" | "green" | "oxblood"; children: React.ReactNode }) {
  const t = { amber: "border-amber-line bg-amber-tint text-amber-ink", green: "border-green/20 bg-green-tint text-green", oxblood: "border-oxblood-line bg-oxblood-tint text-oxblood" };
  return <div role={tone === "oxblood" ? "alert" : "status"} className={clsx("rounded-xl border px-4 py-3 text-[12.5px] leading-[1.55] shadow-xs", t[tone])}>{children}</div>;
}

const AVATAR_TONES = ["bg-oxblood-tint text-oxblood", "bg-teal-tint text-teal", "bg-gold-tint text-gold-deep", "bg-indigo-tint text-indigo", "bg-plum-tint text-plum"];
/** Initials in a soft coloured circle; the colour is stable per name so a person is recognisable at a glance. */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const tone = AVATAR_TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return <span aria-hidden className={clsx("flex flex-none items-center justify-center rounded-full font-display font-bold", tone, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>;
}
