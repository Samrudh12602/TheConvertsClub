import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, StatusPill } from "@/components/portal/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Students" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; plan?: string }> }) {
  const { q, plan } = await searchParams;
  const [students, plans] = await Promise.all([
    db.user.findMany({
      where: {
        role: "STUDENT",
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
        ...(plan ? { enrollments: { some: { status: "ACTIVE", product: { slug: plan } } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { studentProfile: true, enrollments: { where: { status: "ACTIVE" }, include: { product: { select: { name: true, slug: true } } }, orderBy: { createdAt: "asc" } }, _count: { select: { studentSessions: true } } },
    }),
    // Every product ever purchased, for the filter — not the full catalog, so the list stays short.
    db.product.findMany({ where: { enrollments: { some: {} } }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <PortalPage width="max-w-[1100px]">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or email" className="min-h-11 flex-1 rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:max-w-xs md:text-[13px]" />
        <select name="plan" defaultValue={plan ?? ""} className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[13px] text-ink">
          <option value="">All plans</option>
          {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
        <button type="submit" className="min-h-11 rounded-lg border border-line-strong bg-white px-4 text-[12.5px] font-semibold text-ink-2">Filter</button>
        {(q || plan) && <Link href="/admin/students" className="inline-flex min-h-11 items-center px-2 text-[12.5px] font-medium text-ink-faint no-underline">Clear</Link>}
      </form>
      {students.length === 0 ? <Empty>No students found.</Empty> : (
        <div className="overflow-x-auto rounded-[10px] border border-line bg-card">
          <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
            <thead><tr className="border-b border-line">{["Name", "Enrolled in", "College", "Sessions", "Status", ""].map((h) => <th key={h} className="type-label px-3.5 py-2.5 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-line-soft last:border-b-0 hover:bg-surface">
                  <td className="px-3.5 py-2.5"><p className="font-medium text-ink-body">{nm(s.name)}{s.isDemo && <span className="ml-1.5 text-[10px] font-semibold uppercase text-ink-faint">demo</span>}</p><p className="text-[11px] text-ink-faint">{s.email}</p></td>
                  <td className="px-3.5 py-2.5">
                    {s.enrollments.length === 0 ? (
                      <span className="text-ink-faint">Not enrolled</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">{s.enrollments.map((e) => <span key={e.id} className="rounded-md bg-line-soft px-2 py-1 text-[11px] font-semibold text-ink-2">{e.product.name}</span>)}</div>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-muted">{s.studentProfile?.college ?? "—"}</td>
                  <td className="tnum px-3.5 py-2.5 text-ink-muted">{s._count.studentSessions}</td>
                  <td className="px-3.5 py-2.5"><StatusPill tone={s.status === "ACTIVE" ? "green" : "oxblood"}>{s.status === "ACTIVE" ? "Active" : "Suspended"}</StatusPill></td>
                  <td className="px-3.5 py-2.5"><Link href={`/admin/students/${s.id}`} className="text-xs font-semibold">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalPage>
  );
}
