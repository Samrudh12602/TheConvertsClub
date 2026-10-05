import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel } from "@/components/portal/ui";
import { CouponForm, CouponToggle, ProductRow } from "@/components/admin/product-controls";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { earlyBirdTaken } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function ProductsPage() {
  const [products, coupons] = await Promise.all([
    db.product.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { enrollments: true } } } }),
    // Every coupon, generic and mentor — one place to see every code and how much it's actually
    // been used, not split across pages. A mentor's own row still links to their full breakdown.
    db.coupon.findMany({ orderBy: [{ usedCount: "desc" }, { createdAt: "desc" }], include: { mentor: { include: { user: { select: { name: true } } } } } }),
  ]);
  const taken = await earlyBirdTaken();
  return (
    <PortalPage width="max-w-[1000px]">
      <Panel title="Catalog" flush={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
            <thead><tr className="border-b border-line">{["Product", "Price ₹", "MRP ₹", "Mentor code ₹", "Early bird", "Active", ""].map((h) => <th key={h} className="type-label px-3.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>{products.map((p) => <ProductRow key={p.id} id={p.id} name={`${p.name} · ${p._count.enrollments} sold`} pricePaise={p.pricePaise} mrpPaise={p.mrpPaise} mentorPricePaise={p.mentorPricePaise} earlyBirdPricePaise={p.earlyBirdPricePaise} earlyBirdSeats={p.earlyBirdSeats} earlyBirdTaken={taken.get(p.id) ?? 0} active={p.active} />)}</tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Coupons">
        <div className="border-b border-line-soft p-3.5"><CouponForm /></div>
        {coupons.length === 0 ? <Empty>No coupons yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
              <thead><tr className="border-b border-line">{["Code", "Owner", "Discount", "Used", "Active"].map((h) => <th key={h} className="type-label px-3.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-line-soft last:border-b-0">
                    <td className="tnum px-3.5 py-2.5 font-semibold text-ink">{c.code}</td>
                    <td className="px-3.5 py-2.5 text-ink-2">
                      {c.mentor ? <Link href={`/admin/mentors/${c.mentor.id}`} className="font-medium text-oxblood no-underline hover:underline">{nm(c.mentor.user.name)}</Link> : <span className="text-ink-faint">General</span>}
                    </td>
                    <td className="px-3.5 py-2.5 text-ink-2">{c.type === "PERCENT" ? `${c.value}%` : `₹${c.value / 100}`}</td>
                    <td className="tnum px-3.5 py-2.5 text-ink-body">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}{c.expiresAt ? ` · expires ${fmtDate(c.expiresAt)}` : ""}</td>
                    <td className="px-3.5 py-2.5"><CouponToggle id={c.id} active={c.active} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PortalPage>
  );
}
