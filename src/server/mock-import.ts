import { db } from "@/lib/db";
import type { ParsedMock } from "@/lib/mock-docx";
import { topicFor } from "@/lib/mock-topics";

export class MockImportError extends Error {}

export interface MockSettings {
  slug: string; title: string; description?: string | null; durationMin: number; isTest: boolean; sortOrder: number;
  status: "DRAFT" | "PUBLISHED"; releaseAt: Date | null; marks: number; negative: number;
}

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** What a stored paper needs before it can be saved: four options each, a key, numbered 1..n. A paper with problems is never stored. */
function assertSound(p: ParsedMock) {
  if (p.problems.length) throw new MockImportError(`The paper has problems: ${p.problems.slice(0, 5).join("; ")}${p.problems.length > 5 ? ` (and ${p.problems.length - 5} more)` : ""}`);
  if (p.total === 0) throw new MockImportError("No questions were found in that file.");
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function writeQuestions(tx: Tx, mockId: string, p: ParsedMock, marks: number, negative: number) {
  for (const [si, s] of p.sections.entries()) {
    const sec = await tx.mockSection.create({ data: { mockId, name: s.name, sortOrder: si } });
    await tx.mockQuestion.createMany({
      data: s.questions.map((q) => {
        const ctxText = q.context?.lines?.join(" ") ?? "";
        return { mockId, sectionId: sec.id, number: q.number, stem: q.stem, context: q.context ?? undefined, options: q.options, correct: q.correct, explanation: q.explanation, topic: topicFor(s.name, `${ctxText} ${q.stem}`, q.number), marks, negative };
      }),
    });
  }
}

/** Creates a mock from a parsed paper. With `replaceSlug`, an existing mock with that slug is replaced, but only while nobody has attempted it. */
export async function createMockFromParsed(p: ParsedMock, s: MockSettings, opts: { replaceSlug?: boolean } = {}) {
  assertSound(p);
  if (!s.slug) throw new MockImportError("Give the mock a short URL name.");
  const existing = await db.mock.findUnique({ where: { slug: s.slug }, include: { _count: { select: { attempts: true } } } });
  if (existing && !opts.replaceSlug) throw new MockImportError(`There is already a mock called “${s.slug}”. Pick another URL name.`);
  if (existing && existing._count.attempts > 0) throw new MockImportError("That mock already has attempts, so its questions can't be replaced.");
  return db.$transaction(async (tx) => {
    if (existing) await tx.mock.delete({ where: { id: existing.id } });
    const mock = await tx.mock.create({
      data: {
        slug: s.slug, title: s.title, durationMin: s.durationMin, isTest: s.isTest, sortOrder: s.sortOrder, status: s.status, releaseAt: s.releaseAt,
        description: s.description || `${p.total} questions, ${s.durationMin} minutes, +${s.marks} for a right answer and −${s.negative} for a wrong one, in the SNAP exam format.`,
      },
    });
    await writeQuestions(tx, mock.id, p, s.marks, s.negative);
    return mock;
  }, { timeout: 60_000, maxWait: 15_000 });
}

/** Swaps the questions of an existing mock for a new paper. Refused once anyone has attempted it. */
export async function replaceMockPaper(mockId: string, p: ParsedMock, marking?: { marks: number; negative: number }) {
  assertSound(p);
  const m = await db.mock.findUnique({ where: { id: mockId }, include: { _count: { select: { attempts: true } }, questions: { take: 1, select: { marks: true, negative: true } } } });
  if (!m) throw new MockImportError("Mock not found.");
  if (m._count.attempts > 0) throw new MockImportError("Students have already attempted this mock, so its questions can't be replaced. Create a new mock instead.");
  const marks = marking?.marks ?? m.questions[0]?.marks ?? 1;
  const negative = marking?.negative ?? m.questions[0]?.negative ?? 0.25;
  await db.$transaction(async (tx) => {
    await tx.mockSection.deleteMany({ where: { mockId } }); // questions go with their sections
    await tx.mockQuestion.deleteMany({ where: { mockId } });
    await writeQuestions(tx, mockId, p, marks, negative);
    if (m.status === "PUBLISHED") await tx.mock.update({ where: { id: mockId }, data: { status: "DRAFT" } }); // re-check it before students see it
  }, { timeout: 60_000, maxWait: 15_000 });
  return { total: p.total, hidden: m.status === "PUBLISHED" };
}

/** The next "SNAP 2026 Mock N" number for a series mock. */
export async function nextMockNumber(): Promise<number> {
  const top = await db.mock.aggregate({ where: { isTest: false }, _max: { sortOrder: true } });
  return (top._max.sortOrder ?? 0) + 1;
}
