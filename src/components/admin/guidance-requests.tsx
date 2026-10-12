"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { markGuidanceCalledAction } from "@/app/admin/actions";

export interface RequestRow { key: string; userId: string; kind: string; name: string; email: string; phone: string; product: string; when: string }

/** Guidance calls that are paid for and waiting for you to phone the buyer. Tap the number to call. */
export function GuidanceRequests({ rows }: { rows: RequestRow[] }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  if (rows.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-gold-line bg-gradient-to-br from-gold-tint via-white to-oxblood-tint shadow-card" aria-label="Calls to make">
      <header className="flex items-center gap-3 border-b border-gold-line/70 px-4 py-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-gold text-white shadow-glow"><PhoneCall className="size-[18px]" aria-hidden /></span>
        <div><h2 className="font-display text-[16px] font-bold leading-tight text-ink">{rows.length} call{rows.length === 1 ? "" : "s"} to make</h2><p className="text-[11.5px] text-ink-muted">Paid for and waiting for you to phone them.</p></div>
      </header>
      <ul>
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gold-line/50 px-4 py-3 last:border-b-0">
            <div className="min-w-[200px] flex-1">
              <p className="text-[13.5px] font-semibold text-ink">{r.name} <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-gold-deep ring-1 ring-gold-line">{r.product}</span></p>
              <p className="mt-0.5 text-[12px] text-ink-muted"><a href={`mailto:${r.email}`} className="text-ink-muted">{r.email}</a> · paid {r.when}</p>
            </div>
            <a href={`tel:+91${r.phone}`} className="tnum inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-3.5 text-[13.5px] font-bold text-white no-underline hover:bg-ink-body hover:text-white hover:no-underline"><PhoneCall className="size-4" aria-hidden />+91 {r.phone}</a>
            <Button size="sm" variant="secondary" disabled={pending && busy === r.key} onClick={() => { setBusy(r.key); start(async () => { const res = await markGuidanceCalledAction(r.userId, r.kind); if (res.ok) { toast.success(res.message ?? "Done."); router.refresh(); } else toast.error(res.error); setBusy(null); }); }}>
              <Check className="size-4" aria-hidden /> Mark called
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
