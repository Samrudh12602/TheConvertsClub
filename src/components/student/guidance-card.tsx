import { PhoneCall } from "lucide-react";
import { BUSINESS } from "@/lib/business";

/** For a student who bought a guidance call: it is on its way, and we are about to phone them. */
export function GuidanceCard({ requests, phone }: { requests: { label: string; count: number }[]; phone: string | null }) {
  if (!requests.length) return null;
  const what = requests.map((r) => `${r.count} ${r.label.toLowerCase()}${r.count === 1 ? "" : "s"}`).join(" and ");
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold-line bg-gradient-to-br from-gold-tint via-white to-oxblood-tint p-5 shadow-card" aria-label="Your guidance call">
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-gold text-white shadow-glow"><PhoneCall className="size-5" aria-hidden /></span>
        <div>
          <p className="type-eyebrow text-gold-deep">Your guidance call</p>
          <h2 className="mt-1 font-display text-[19px] font-bold leading-[1.25] text-ink">We&apos;ll phone you about your {what}</h2>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-ink-muted">{phone ? <>We&apos;ll call you on <b className="text-ink">{phone}</b> within one working day to agree a time. </> : "We'll call you within one working day. "}Wrong number? Write to <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>.</p>
        </div>
      </div>
    </section>
  );
}
