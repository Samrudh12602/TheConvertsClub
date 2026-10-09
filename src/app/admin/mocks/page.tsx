import { BarChart3, CheckCircle2, FileCheck2, Users } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel, StatusPill } from "@/components/portal/ui";
import { MockControls } from "@/components/admin/mock-row";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP mocks" };

export default async function AdminMocks() {
  const mocks = await db.mock.findMany({ orderBy: [{ isTest: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }], include: { _count: { select: { questions: true } }, attempts: { select: { status: true, score: true } } } });
  const sold = await db.creditLedger.groupBy({ by: ["kind"], where: { kind: { in: ["SNAP_MOCK", "SNAP_TEST_MOCK"] }, type: "GRANT" }, _sum: { delta: true } });
  const attempts = mocks.reduce((n, m) => n + m.attempts.length, 0);
  const done = mocks.reduce((n, m) => n + m.attempts.filter((a) => a.status === "SUBMITTED").length, 0);
  return (
    <PortalPage width="max-w-[1040px]">
      <KpiGrid>
        <Kpi label="Mocks" value={mocks.length} note={`${mocks.filter((m) => m.status === "PUBLISHED").length} published`} icon={<FileCheck2 />} accent="oxblood" />
        <Kpi label="Attempts" value={attempts} note={`${done} submitted`} icon={<Users />} accent="indigo" />
        <Kpi label="Series credits sold" value={sold.find((s) => s.kind === "SNAP_MOCK")?._sum.delta ?? 0} note="Across all packs" icon={<BarChart3 />} accent="teal" />
        <Kpi label="Test mocks sold" value={sold.find((s) => s.kind === "SNAP_TEST_MOCK")?._sum.delta ?? 0} note="At the test price" icon={<CheckCircle2 />} accent="gold" />
      </KpiGrid>
      <Panel title="Mocks" flush={false}>
        {mocks.length === 0 ? <Empty art="sessions">No mocks imported yet.</Empty> : (
          <ul className="flex flex-col gap-3">
            {mocks.map((m) => {
              const scored = m.attempts.filter((a) => a.status === "SUBMITTED" && a.score !== null).map((a) => a.score as number);
              const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
              return (
                <li key={m.id} className="rounded-2xl border border-line bg-card p-4 shadow-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-ink">{m.title}{m.isTest && <StatusPill tone="amber">Test mock</StatusPill>}<StatusPill tone={m.status === "PUBLISHED" ? "green" : "stone"}>{m.status === "PUBLISHED" ? (m.releaseAt && m.releaseAt > new Date() ? "Scheduled" : "Live") : "Draft"}</StatusPill></p>
                      <p className="mt-1 text-[12px] text-ink-faint">/{m.slug} · {m._count.questions} questions · {m.durationMin} min · {m.attempts.length} attempt{m.attempts.length === 1 ? "" : "s"}{avg !== null ? ` · average ${avg.toFixed(1)}` : ""}</p>
                    </div>
                    <MockControls id={m.id} slug={m.slug} status={m.status} releaseAt={m.releaseAt?.toISOString() ?? null} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <p className="text-[11.5px] leading-[1.6] text-ink-faint">New mocks are imported from the paper (.docx) by the import script, then appear here as drafts. Preview opens the exam exactly as a student sees it, without saving or scoring anything.</p>
    </PortalPage>
  );
}
