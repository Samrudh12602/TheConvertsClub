import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { ChevronRight, GraduationCap, Search, UserCheck, UserX, Video } from "lucide-react";
import { Avatar, Empty, Kpi, KpiGrid, StatusPill } from "@/components/portal/ui";
import { adminDb } from "@/server/demo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Students" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; plan?: string }> }) {
  const db = await adminDb();
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

  const enrolled = students.filter((s) => s.enrollments.length > 0).length;
  const totalSessions = students.reduce((n, s) => n + s._count.studentSessions, 0);
  return (
    <PortalPage width="max-w-[1100px]">
      <KpiGrid>
        <Kpi label="Students shown" value={students.length} note={q || plan ? "Filtered" : "Newest first"} icon={<GraduationCap />} accent="indigo" />
        <Kpi label="Enrolled" value={enrolled} note="Hold at least one plan" noteTone="green" icon={<UserCheck />} accent="teal" />
        <Kpi label="Not enrolled" value={students.length - enrolled} note="Signed up, no plan yet" noteTone={students.length - enrolled ? "amber" : "muted"} icon={<UserX />} accent="gold" />
        <Kpi label="Sessions taken" value={totalSessions} note="Across these students" icon={<Video />} accent="oxblood" />
      </KpiGrid>
      <form className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1 md:max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={q} placeholder="Search name or email" className="min-h-11 w-full rounded-xl border border-line-strong bg-white pl-9 pr-3 text-base text-ink shadow-xs transition focus:border-oxblood focus:ring-2 focus:ring-oxblood/15 md:text-[13px]" />
        </div>
        <select name="plan" defaultValue={plan ?? ""} className="min-h-11 rounded-xl border border-line-strong bg-white px-3 text-[13px] text-ink shadow-xs">
          <option value="">All plans</option>
          {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
        <button type="submit" className="min-h-11 rounded-xl bg-ink px-5 text-[12.5px] font-semibold text-white shadow-xs transition hover:bg-ink-2">Filter</button>
        {(q || plan) && <Link href="/admin/students" className="inline-flex min-h-11 items-center px-2 text-[12.5px] font-medium text-ink-faint no-underline">Clear</Link>}
      </form>
      {students.length === 0 ? <Empty>No students found.</Empty> : (
        <>
        <ul className="flex flex-col gap-2.5 md:hidden">
          {students.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 text-inherit no-underline shadow-card hover:no-underline">
                <Avatar name={nm(s.name)} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{nm(s.name)}{s.isDemo && <span className="ml-1.5 rounded bg-line-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-ink-faint">demo</span>}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">{s.enrollments.length ? s.enrollments.map((e) => e.product.name).join(" · ") : "Not enrolled"}</span>
                  <span className="mt-1 block text-[11px] text-ink-muted">{s._count.studentSessions} session{s._count.studentSessions === 1 ? "" : "s"}{s.studentProfile?.college ? ` · ${s.studentProfile.college}` : ""}</span>
                </span>
                <StatusPill tone={s.status === "ACTIVE" ? "green" : "oxblood"}>{s.status === "ACTIVE" ? "Active" : "Suspended"}</StatusPill>
                <ChevronRight aria-hidden className="size-4 flex-none text-ink-faint" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-card md:block">
          <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
            <thead><tr className="border-b border-line bg-surface/60">{["Student", "Enrolled in", "College", "Sessions", "Status", ""].map((h) => <th key={h} className="type-label px-4 py-3 text-ink-faint">{h}</th>)}</tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="group border-b border-line-soft transition-colors last:border-b-0 hover:bg-oxblood-tint/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3 text-inherit no-underline hover:no-underline">
                      <Avatar name={nm(s.name)} />
                      <span><span className="block font-semibold text-ink">{nm(s.name)}{s.isDemo && <span className="ml-1.5 rounded bg-line-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-faint">demo</span>}</span><span className="block text-[11px] text-ink-faint">{s.email}</span></span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {s.enrollments.length === 0 ? (
                      <span className="text-ink-faint">Not enrolled</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">{s.enrollments.map((e) => <span key={e.id} className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-2">{e.product.name}</span>)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{s.studentProfile?.college ?? "—"}</td>
                  <td className="tnum px-4 py-3 font-semibold text-ink-2">{s._count.studentSessions}</td>
                  <td className="px-4 py-3"><StatusPill tone={s.status === "ACTIVE" ? "green" : "oxblood"}>{s.status === "ACTIVE" ? "Active" : "Suspended"}</StatusPill></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/students/${s.id}`} aria-label={`Open ${nm(s.name)}`} className="inline-flex text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-oxblood"><ChevronRight className="size-4" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </PortalPage>
  );
}
