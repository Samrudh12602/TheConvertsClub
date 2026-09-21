"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { packages, services } from "@/lib/data";
import { formatINR } from "@/lib/format";

export function ProductsClient() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries([...packages, ...services].map((p) => [p.id, true]))
  );

  const toggle = (id: string) => setActive((a) => ({ ...a, [id]: !a[id] }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Products & pricing</h1>

      <Card>
        <CardHeader title="Early-bird" subtitle="Applies to both packages" />
        <div className="grid sm:grid-cols-2 gap-4 max-w-md">
          <Input label="End date" type="date" defaultValue="2026-10-15" />
          <Input label="Badge text" defaultValue="Early-bird pricing" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Packages" action={<Button size="sm"><Plus size={14} /> New package</Button>} />
        <div className="space-y-3">
          {packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-hairline p-3.5 flex-wrap">
              <div>
                <p className="font-semibold text-ink text-sm">{p.name}</p>
                <p className="text-xs text-muted mt-0.5 tabular-nums">
                  {formatINR(p.price)} · MRP {formatINR(p.mrp)} · {p.credits.pi} PI, {p.credits.gdge} GD/GE, {p.credits.wat} WAT
                </p>
              </div>
              <div className="flex items-center gap-3">
                {p.badge && <Badge variant="gold">{p.badge}</Badge>}
                <label className="flex items-center gap-2 text-xs text-ink">
                  <input type="checkbox" checked={active[p.id]} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[var(--gold-500)]" />
                  Active
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Individual services" action={<Button size="sm"><Plus size={14} /> New service</Button>} />
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-hairline p-3.5 flex-wrap">
              <div>
                <p className="font-semibold text-ink text-sm">{s.name}</p>
                <p className="text-xs text-muted mt-0.5 tabular-nums">{formatINR(s.price)}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-ink">
                <input type="checkbox" checked={active[s.id]} onChange={() => toggle(s.id)} className="h-4 w-4 accent-[var(--gold-500)]" />
                Active
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Coupons" action={<Button size="sm"><Plus size={14} /> New coupon</Button>} />
        <div className="space-y-2.5">
          {[
            { code: "EARLYBIRD10", discount: "10% off", uses: 24 },
            { code: "REFER500", discount: "₹500 off", uses: 6 },
          ].map((c) => (
            <div key={c.code} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <div>
                <Badge variant="outline">{c.code}</Badge>
                <span className="text-sm text-ink ml-3">{c.discount}</span>
              </div>
              <span className="text-xs text-muted">{c.uses} uses</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
