import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamClient, type ExamSection, type SavedState } from "@/components/mocks/exam-client";
import { ExamEntry } from "@/components/mocks/exam-entry";
import { nowMs } from "@/lib/datetime";
import { roleHome } from "@/lib/roles";
import { loadExam } from "@/server/mocks";
import { currentUser, requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SNAP mock", robots: { index: false, follow: false } };

/**
 * The exam, full screen and outside the portal chrome. Students: instructions first, the paper only after they start (the server
 * clock begins then). The owner can open any mock as a preview, which saves and scores nothing.
 */
export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await currentUser();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/exam/${slug}`)}`);
  const preview = viewer.role === "ADMIN";
  if (!preview && viewer.role !== "STUDENT") redirect(roleHome(viewer.role));
  const user = preview ? viewer : await requireStudent();
  const data = await loadExam(user.id, slug, { preview });
  if (!data) notFound();
  const { mock, attempt } = data;

  if (attempt?.status === "SUBMITTED") redirect(`/student/mocks/${attempt.id}`);

  const sections: ExamSection[] = mock.sections.map((s) => ({ id: s.id, name: s.name, questions: s.questions.map((q) => ({ id: q.id, number: q.number, stem: q.stem, context: q.context, options: q.options, marks: q.marks, negative: q.negative })) }));
  const candidate = (user.name ?? user.email).replace(/\s*\(demo\)/, "");
  const first = sections[0]?.questions[0];

  if (attempt && !preview) {
    const saved: Record<string, SavedState> = {};
    for (const r of attempt.responses) saved[r.questionId] = { choice: r.choice, marked: r.marked, visited: r.visited };
    return <ExamClient slug={slug} attemptId={attempt.id} title={mock.title} candidate={candidate} durationMin={mock.durationMin} remainingMs={Math.max(0, attempt.endsAt.getTime() - nowMs())} sections={sections} saved={saved} />;
  }
  // Not started: send only the outline (no questions) so nothing is readable before the clock starts.
  return (
    <ExamEntry slug={slug} title={mock.title} candidate={candidate} durationMin={mock.durationMin} marks={first?.marks ?? 1} negative={first?.negative ?? 0.25}
      summary={sections.map((s) => ({ name: s.name, count: s.questions.length }))} previewSections={preview ? sections : undefined} />
  );
}
