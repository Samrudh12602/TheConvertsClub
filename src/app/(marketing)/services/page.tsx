import { Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { services } from "@/lib/data";
import { formatINR } from "@/lib/format";

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Individual services</h1>
        <p className="mt-3 text-muted">Buy exactly what you need, no package required.</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink text-lg">{s.name}</h3>
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Clock3 size={13} /> {s.duration}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted flex-1">{s.description}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-display text-2xl font-bold text-ink tabular-nums">{formatINR(s.price)}</span>
              <ButtonLink href={`/checkout?service=${s.id}`} size="sm">
                Buy
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-14 max-w-4xl mx-auto rounded-[var(--radius-lg)] border border-hairline bg-sunken/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <h3 className="font-semibold text-ink text-lg">Doing more than one or two sessions?</h3>
          <p className="text-sm text-muted mt-1">Call Convert and Call Convert Plus work out cheaper for the full season.</p>
        </div>
        <ButtonLink href="/packages" className="shrink-0">
          See packages
        </ButtonLink>
      </div>
    </div>
  );
}
