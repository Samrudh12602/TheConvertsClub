import { BarChart3, CheckCircle2, FileCheck2, Users } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel } from "@/components/portal/ui";
import { MockCard } from "@/components/admin/mock-card";
import { MockUpload } from "@/components/admin/mock-upload";
import { nextMockNumber } from "@/server/mock-import";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP mocks" };

export default async function AdminMocks() {
  const mocks = await db.mock.findMany({ orderBy: [{ isTest: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }], include: { _count: { select: { questions: true } }, attempts: { select: { status: true, score: true } }, questions: { take: 1, select: { marks: true, negative: true } } } });
  const sold = await db.creditLedger.groupBy({ by: ["kind"], where: { kind: { in: ["SNAP_MOCK", "SNAP_TEST_MOCK"] }, type: "GRANT" }, _sum: { delta: true } });
  const nextNumber = await nextMockNumber();
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
      <Panel title="Add a mock from a Word file" flush={false}>
        <MockUpload nextNumber={nextNumber} />
      </Panel>

      <Panel title="Your mocks" flush={false}>
        {mocks.length === 0 ? <Empty art="sessions">No mocks yet. Upload a paper above.</Empty> : (
          <ul className="flex flex-col gap-3">
            {mocks.map((m) => {
              const scored = m.attempts.filter((a) => a.status === "SUBMITTED" && a.score !== null).map((a) => a.score as number);
              return <MockCard key={m.id} m={{
                id: m.id, slug: m.slug, title: m.title, description: m.description, durationMin: m.durationMin, sortOrder: m.sortOrder, isTest: m.isTest, status: m.status, releaseAt: m.releaseAt?.toISOString() ?? null,
                questions: m._count.questions, marks: m.questions[0]?.marks ?? 1, negative: m.questions[0]?.negative ?? 0.25, attempts: m.attempts.length, submitted: m.attempts.filter((a) => a.status === "SUBMITTED").length,
                avgScore: scored.length ? scored.reduce((x, y) => x + y, 0) / scored.length : null, bestScore: scored.length ? Math.max(...scored) : null,
              }} />;
            })}
          </ul>
        )}
      </Panel>
      <p className="text-[11.5px] leading-[1.6] text-ink-faint">Upload a paper and it is read, checked, tagged by topic and saved for you. Preview opens the exam exactly as a student sees it, without saving or scoring anything. Mocks that students have already attempted keep their questions and marking fixed, so past scores never change.</p>
    </PortalPage>
  );
}
