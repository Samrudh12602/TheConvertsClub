import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel } from "@/components/portal/ui";
import { CouponForm, CouponToggle, ProductRow } from "@/components/admin/product-controls";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, coupons] = await Promise.all([
    db.product.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { enrollments: true } } } }),
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <PortalPage width="max-w-[1000px]">
      <Panel title="Catalog" flush={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
            <thead><tr className="border-b border-line">{["Product", "Price ₹", "MRP ₹", "Active", ""].map((h) => <th key={h} className="type-label px-3.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>{products.map((p) => <ProductRow key={p.id} id={p.id} name={`${p.name} · ${p._count.enrollments} sold`} pricePaise={p.pricePaise} mrpPaise={p.mrpPaise} active={p.active} />)}</tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Coupons" flush={false}>
        <CouponForm />
        <div className="mt-3.5 flex flex-col gap-1.5 border-t border-line-soft pt-3.5">
          {coupons.length === 0 ? <Empty>No coupons yet.</Empty> : coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="tnum font-semibold text-ink">{c.code}</span>
              <span className="text-ink-muted">{c.type === "PERCENT" ? `${c.value}%` : `₹${c.value / 100}`} · used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}{c.expiresAt ? ` · expires ${fmtDate(c.expiresAt)}` : ""}</span>
              <CouponToggle id={c.id} active={c.active} />
            </div>
          ))}
        </div>
      </Panel>
    </PortalPage>
  );
}
