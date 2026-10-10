import { Check } from "lucide-react";
import { PortalBuy } from "@/components/student/portal-buy";
import { db } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import { paymentsConfigured } from "@/server/razorpay";
import { SNAP_FIVE_SLUG, SNAP_SERIES_TOTAL, SNAP_TEN_SLUG, SNAP_TEST_SLUG, SNAP_UPGRADE_SLUG, offerSlugs, seriesLive, snapStanding } from "@/server/snap-offers";

const per = (p: CatalogProduct, n: number) => `${formatPaise(Math.round(priceView(p).payablePaise / n))} a mock`;

/**
 * The SNAP packs worth showing this student, decided by what they already own: a new student sees the three plans, a test-mock
 * buyer the 5 and 10 packs, a 5-pack buyer the +5 upgrade. Renders nothing when there is nothing more to sell.
 */
export async function SnapOffers({ user, title, lead }: { user: { id: string; name: string | null; email: string; phone: string | null }; title: string; lead?: string }) {
  const [standing, live] = await Promise.all([snapStanding(db, user.id), seriesLive(db)]);
  const products = (await Promise.all(offerSlugs(standing).map((s) => getProduct(s)))).filter((p): p is CatalogProduct => Boolean(p));
  if (products.length === 0) return null;
  const me = { name: user.name?.replace(/\s*\(demo\)/, "") ?? "", email: user.email, phone: user.phone ?? "" };
  const canPay = paymentsConfigured();
  const soonNote = live < SNAP_SERIES_TOTAL ? `${live} of ${SNAP_SERIES_TOTAL} mocks are live today. The rest are being added, and your credits cover them as they open.` : null;
  const card = (p: CatalogProduct) => {
    const bullets: string[] = p.slug === SNAP_TEST_SLUG
      ? ["One full-length mock on the real exam screen", "Complete analysis, solutions and a PDF", "One per person"]
      : p.slug === SNAP_FIVE_SLUG
        ? ["5 full-length mocks: use them on any mock, in any order", "Analysis, solutions and a PDF for each", "Section, topic and time breakdown"]
        : p.slug === SNAP_TEN_SLUG
          ? ["10 full-length mocks, any order", "Everything in the 5-pack, twice the practice", "Track your score and weak topics across mocks"]
          : ["5 more mocks added to your account", "Your 5 stay: you'll have 10 in all", "Same analysis and PDF for each"];
    const note = p.slug === SNAP_TEN_SLUG || p.slug === SNAP_UPGRADE_SLUG ? soonNote : p.slug === SNAP_FIVE_SLUG && live > 0 ? `Choose any 5 of the ${live} mocks that are live.` : null;
    const perMock = p.slug === SNAP_FIVE_SLUG ? per(p, 5) : p.slug === SNAP_TEN_SLUG ? per(p, 10) : null;
    const tag = p.slug === SNAP_TEST_SLUG ? "Start here" : p.slug === SNAP_TEN_SLUG ? "Best value" : p.slug === SNAP_UPGRADE_SLUG ? "Upgrade" : null;
    return (
      <div key={p.slug} className="flex flex-col gap-2.5 rounded-xl bg-white/[0.07] p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-2"><p className="text-[13.5px] font-semibold leading-[1.3]">{p.name}</p>{tag && <span className="flex-none rounded-full bg-brand px-2 py-1 text-[10px] font-semibold leading-none text-white">{tag}</span>}</div>
        <p className="tnum font-display text-[28px] font-bold leading-none">{formatPaise(priceView(p).payablePaise)}</p>
        {perMock && <p className="-mt-1 text-[11.5px] font-medium text-gold">{perMock}</p>}
        <ul className="flex flex-col gap-1.5">{bullets.map((b) => <li key={b} className="flex items-start gap-2 text-[12px] leading-[1.5] text-dark-soft"><Check className="mt-0.5 size-3.5 flex-none text-gold" aria-hidden />{b}</li>)}</ul>
        {note && <p className="text-[11px] leading-[1.5] text-dark-muted">{note}</p>}
        <div className="mt-auto pt-1">{canPay ? <PortalBuy slug={p.slug} me={me} label={p.slug === SNAP_UPGRADE_SLUG ? `Upgrade for ${formatPaise(priceView(p).payablePaise)}` : `Buy for ${formatPaise(priceView(p).payablePaise)}`} variant="onDark" /> : <p className="text-[11.5px] text-dark-muted">Payments open soon.</p>}</div>
      </div>
    );
  };
  return (
    <section aria-label={title} className="overflow-hidden rounded-2xl bg-night p-5 text-surface shadow-lift ring-1 ring-white/5">
      <p className="type-eyebrow text-gold">{standing.five ? "Go further" : standing.test ? "Next step" : "SNAP 2026 mocks"}</p>
      <h2 className="mt-1.5 font-display text-[20px] font-bold leading-[1.2]">{title}</h2>
      {lead && <p className="mt-1.5 max-w-[60ch] text-[12.5px] leading-[1.6] text-dark-soft">{lead}</p>}
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))" }}>{products.map(card)}</div>
    </section>
  );
}
