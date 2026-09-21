import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/marketing/countdown";
import { packages, earlyBirdEndDate } from "@/lib/data";
import { formatINR } from "@/lib/format";

const COMPARISON_ROWS = [
  { label: "Mock PI", key: "pi" as const },
  { label: "Mock GD/GE", key: "gdge" as const },
  { label: "WAT evaluation", key: "wat" as const },
  { label: "Detailed SOP review", key: "sop" as const },
  { label: "Strategy calls", key: "strategyCalls" as const },
];

const EXTRA_ROWS = [
  { label: "Profile review", both: true },
  { label: "Personalised PI booklet / dossier", both: true },
  { label: "Application form guidance", both: true },
  { label: "Multi-college prep", onlyPlus: true },
  { label: "WhatsApp support", both: true },
];

export default function PackagesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="gold">Early-bird pricing</Badge>
        <h1 className="font-display mt-4 text-3xl sm:text-4xl font-semibold text-ink">Packages and pricing</h1>
        <p className="mt-3 text-muted">Everything bundled for the season — no add-on surprises.</p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Early-bird ends in</p>
          <Countdown target={earlyBirdEndDate} />
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {packages.map((pkg) => (
          <Card key={pkg.id} padding="lg" className={pkg.badge ? "border-accent ring-2 ring-accent relative" : "relative"}>
            {pkg.badge && (
              <span className="absolute -top-3.5 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-gold">
                {pkg.badge}
              </span>
            )}
            <h2 className="font-display text-2xl font-semibold text-ink">{pkg.name}</h2>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display text-4xl font-bold text-ink tabular-nums">{formatINR(pkg.price)}</span>
              <span className="text-base text-muted line-through tabular-nums">{formatINR(pkg.mrp)}</span>
              <Badge variant="success">Save {Math.round((1 - pkg.price / pkg.mrp) * 100)}%</Badge>
            </div>
            <ul className="mt-6 space-y-3">
              {pkg.inclusions.map((inc) => (
                <li key={inc} className="flex items-start gap-2.5 text-sm text-ink">
                  <Check size={16} className="text-success shrink-0 mt-0.5" /> {inc}
                </li>
              ))}
            </ul>
            <ButtonLink
              href={`/checkout?package=${pkg.id}`}
              fullWidth
              size="lg"
              variant={pkg.badge ? "primary" : "secondary"}
              className="mt-7"
            >
              Choose {pkg.name}
            </ButtonLink>
          </Card>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mt-16 max-w-4xl mx-auto overflow-x-auto">
        <h2 className="font-display text-xl font-semibold text-ink mb-4">Full comparison</h2>
        <table className="w-full min-w-[560px] rounded-[var(--radius-lg)] border border-hairline bg-surface text-sm overflow-hidden">
          <thead>
            <tr className="border-b border-hairline bg-sunken/50">
              <th className="text-left px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wide">Included</th>
              {packages.map((p) => (
                <th key={p.id} className="px-5 py-3.5 font-semibold text-ink text-center">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3.5 text-ink">{row.label}</td>
                {packages.map((p) => (
                  <td key={p.id} className="px-5 py-3.5 text-center font-semibold text-ink tabular-nums">
                    {p.credits[row.key]}
                  </td>
                ))}
              </tr>
            ))}
            {EXTRA_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3.5 text-ink">{row.label}</td>
                <td className="px-5 py-3.5 text-center">
                  {row.onlyPlus ? <Minus size={16} className="text-muted mx-auto" /> : <Check size={16} className="text-success mx-auto" />}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Check size={16} className="text-success mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Build your own */}
      <div className="mt-14 max-w-4xl mx-auto rounded-[var(--radius-lg)] border border-hairline bg-sunken/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <h3 className="font-semibold text-ink text-lg">Not ready for a full package?</h3>
          <p className="text-sm text-muted mt-1">Buy individual services — Mock PI, GD/GE, WAT or SOP review — starting at ₹99.</p>
        </div>
        <ButtonLink href="/services" variant="secondary" className="shrink-0">
          Browse services
        </ButtonLink>
      </div>
    </div>
  );
}
