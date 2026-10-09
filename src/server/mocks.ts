import type { CreditKind, Mock } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { analyse, percentile, MIN_COHORT_FOR_QUESTION_STATS, type Analysis, type QInfo, type RInfo } from "@/lib/mock-analysis";
import { consumeCredit, getBalances, lockUser, reserveCredit } from "@/server/credits";

/**
 * SNAP mocks. The questions and the answer key live only here: the exam page is sent the questions without the key, every
 * save is checked against a deadline the server set, and marks are worked out on the server when the attempt closes.
 */

export class MockError extends Error {}

export const SNAP_MOCK_KIND: CreditKind = "SNAP_MOCK";
export const SNAP_TEST_KIND: CreditKind = "SNAP_TEST_MOCK";
export const creditKindFor = (m: Pick<Mock, "isTest">): CreditKind => (m.isTest ? SNAP_TEST_KIND : SNAP_MOCK_KIND);

/** A mock can be taken once it is published and its release time (if any) has passed. */
export const isReleased = (m: Pick<Mock, "status" | "releaseAt">, at = new Date()) => m.status === "PUBLISHED" && (!m.releaseAt || m.releaseAt <= at);

/** Seconds of grace after the deadline for a save that was already in flight. */
const GRACE_MS = 8_000;

export async function mockBalances(userId: string) {
  const bal = await getBalances(db, userId);
  return { series: bal.SNAP_MOCK?.available ?? 0, test: bal.SNAP_TEST_MOCK?.available ?? 0 };
}

/** What the mocks page shows a student: every published mock, their attempt (if any) and whether they can start it. */
export async function listMocksFor(userId: string | null, at = new Date()) {
  const mocks = await db.mock.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ isTest: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }], include: { _count: { select: { questions: true } }, sections: { select: { name: true }, orderBy: { sortOrder: "asc" } } } });
  const attempts = userId ? await db.mockAttempt.findMany({ where: { userId }, select: { id: true, mockId: true, status: true, score: true, endsAt: true, submittedAt: true } }) : [];
  const bal = userId ? await mockBalances(userId) : { series: 0, test: 0 };
  return {
    balances: bal,
    mocks: mocks.map((m) => {
      const att = attempts.find((a) => a.mockId === m.id) ?? null;
      const expired = att?.status === "IN_PROGRESS" && att.endsAt.getTime() + GRACE_MS < at.getTime();
      return {
        id: m.id, slug: m.slug, title: m.title, description: m.description, durationMin: m.durationMin, isTest: m.isTest, questions: m._count.questions, sections: m.sections.map((s) => s.name),
        released: isReleased(m, at), releaseAt: m.releaseAt,
        attempt: att ? { id: att.id, status: expired ? ("SUBMITTED" as const) : att.status, score: att.score } : null,
        canStart: !att && isReleased(m, at) && (m.isTest ? bal.test : bal.series) > 0,
      };
    }),
  };
}

/** Closes an attempt: works out the marks from what was saved and stores them. Safe to call twice. */
export async function finalizeAttempt(attemptId: string) {
  const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, include: { mock: { include: { questions: { include: { section: true }, orderBy: { number: "asc" } } } }, responses: true } });
  if (!att) throw new MockError("Attempt not found.");
  if (att.status === "SUBMITTED") return att;
  const a = analyse(att.mock.questions.map(toQInfo), att.responses.map(toRInfo), att.mock.durationMin * 60);
  const submittedAt = new Date(Math.min(Date.now(), att.endsAt.getTime()));
  await db.mockAttempt.updateMany({ where: { id: attemptId, status: "IN_PROGRESS" }, data: { status: "SUBMITTED", submittedAt, score: a.score, correctCount: a.correct, wrongCount: a.wrong, skippedCount: a.skipped } });
  return db.mockAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { mock: { include: { questions: { include: { section: true }, orderBy: { number: "asc" } } } }, responses: true } });
}

const toQInfo = (q: { id: string; number: number; section: { name: string }; topic: string | null; correct: number; marks: number; negative: number }): QInfo => ({ id: q.id, number: q.number, sectionName: q.section.name, topic: q.topic, correct: q.correct, marks: q.marks, negative: q.negative });
const toRInfo = (r: { questionId: string; choice: number | null; marked: boolean; visited: boolean; timeSec: number; changes: number }): RInfo => ({ questionId: r.questionId, choice: r.choice, marked: r.marked, visited: r.visited, timeSec: r.timeSec, changes: r.changes });

/** Starts the attempt (using one credit) or returns the one already running. A mock can be taken once per student. */
export async function startAttempt(userId: string, slug: string) {
  const mock = await db.mock.findUnique({ where: { slug } });
  if (!mock || !isReleased(mock)) throw new MockError("That mock isn't open yet.");
  const existing = await db.mockAttempt.findUnique({ where: { userId_mockId: { userId, mockId: mock.id } } });
  if (existing) {
    if (existing.status === "IN_PROGRESS" && existing.endsAt.getTime() + GRACE_MS < Date.now()) await finalizeAttempt(existing.id);
    return db.mockAttempt.findUniqueOrThrow({ where: { id: existing.id } });
  }
  const kind = creditKindFor(mock);
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const again = await tx.mockAttempt.findUnique({ where: { userId_mockId: { userId, mockId: mock.id } } });
    if (again) return again;
    const bal = (await getBalances(tx, userId))[kind];
    if (!bal || bal.available < 1) throw new MockError(mock.isTest ? "You need the SNAP test mock to take this one." : "You have no mock credits left. Buy a pack to take this mock.");
    // The credit is spent the moment the clock starts: reserve and consume in one step.
    await reserveCredit(tx, { userId, kind });
    await consumeCredit(tx, { userId, kind, reason: `SNAP mock: ${mock.title}` });
    const startedAt = new Date();
    return tx.mockAttempt.create({ data: { userId, mockId: mock.id, startedAt, endsAt: new Date(startedAt.getTime() + mock.durationMin * 60_000) } });
  });
}

/** What the exam page needs. Never includes the answer key or the solutions. */
export async function loadExam(userId: string, slug: string, opts: { preview?: boolean } = {}) {
  const mock = await db.mock.findUnique({ where: { slug }, include: { sections: { orderBy: { sortOrder: "asc" }, include: { questions: { orderBy: { number: "asc" }, select: { id: true, number: true, stem: true, context: true, options: true, marks: true, negative: true } } } } } });
  if (!mock || (!opts.preview && !isReleased(mock))) return null;
  const att = await db.mockAttempt.findUnique({ where: { userId_mockId: { userId, mockId: mock.id } }, include: { responses: true } });
  if (att && att.status === "IN_PROGRESS" && att.endsAt.getTime() + GRACE_MS < Date.now()) await finalizeAttempt(att.id);
  const fresh = att ? await db.mockAttempt.findUnique({ where: { id: att.id }, include: { responses: true } }) : null;
  return { mock, attempt: fresh };
}

export interface SaveInput { questionId: string; choice: number | null; marked: boolean; visited?: boolean; timeSecDelta?: number }

/** Saves one question's state. Refused once the deadline (plus a few seconds' grace) has passed. */
export async function saveResponse(userId: string, attemptId: string, input: SaveInput) {
  const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { id: true, userId: true, status: true, endsAt: true, mockId: true } });
  if (!att || att.userId !== userId) throw new MockError("Attempt not found.");
  if (att.status !== "IN_PROGRESS" || att.endsAt.getTime() + GRACE_MS < Date.now()) throw new MockError("Time is up. The attempt has closed.");
  const q = await db.mockQuestion.findFirst({ where: { id: input.questionId, mockId: att.mockId }, select: { id: true, options: true } });
  if (!q) throw new MockError("Unknown question.");
  if (input.choice !== null && (!Number.isInteger(input.choice) || input.choice < 0 || input.choice >= q.options.length)) throw new MockError("Unknown option.");
  const delta = Math.max(0, Math.min(900, Math.round(input.timeSecDelta ?? 0)));
  const prev = await db.mockResponse.findUnique({ where: { attemptId_questionId: { attemptId, questionId: q.id } } });
  const changed = prev && prev.choice !== null && prev.choice !== input.choice ? 1 : 0;
  await db.mockResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId: q.id } },
    create: { attemptId, questionId: q.id, choice: input.choice, marked: input.marked, visited: true, timeSec: delta, changes: 0 },
    update: { choice: input.choice, marked: input.marked, visited: true, timeSec: { increment: delta }, ...(changed ? { changes: { increment: 1 } } : {}) },
  });
}

/** Adds time spent on a question without touching the answer (used when the student moves away without saving). */
export async function addTime(userId: string, attemptId: string, questionId: string, timeSecDelta: number) {
  const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true, endsAt: true, mockId: true } });
  if (!att || att.userId !== userId || att.status !== "IN_PROGRESS" || att.endsAt.getTime() + GRACE_MS < Date.now()) return;
  const q = await db.mockQuestion.findFirst({ where: { id: questionId, mockId: att.mockId }, select: { id: true } });
  if (!q) return;
  const delta = Math.max(0, Math.min(900, Math.round(timeSecDelta)));
  await db.mockResponse.upsert({ where: { attemptId_questionId: { attemptId, questionId } }, create: { attemptId, questionId, choice: null, marked: false, visited: true, timeSec: delta }, update: { timeSec: { increment: delta } } });
}

export async function recordTabSwitch(userId: string, attemptId: string) {
  await db.mockAttempt.updateMany({ where: { id: attemptId, userId, status: "IN_PROGRESS" }, data: { tabSwitches: { increment: 1 } } });
}

export async function submitAttempt(userId: string, attemptId: string) {
  const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { userId: true } });
  if (!att || att.userId !== userId) throw new MockError("Attempt not found.");
  await finalizeAttempt(attemptId);
}

export interface ResultView {
  attemptId: string; mock: { slug: string; title: string; isTest: boolean; durationMin: number }; submittedAt: Date | null; tabSwitches: number;
  analysis: Analysis;
  questions: { id: string; number: number; sectionName: string; topic: string | null; stem: string; context: unknown; options: string[]; correct: number; explanation: string | null; cohortCorrectPct: number | null; cohortN: number }[];
  cohort: { attempts: number; avgScore: number | null; percentile: number | null };
}

/** Everything the results page and the PDF need. Only for a closed attempt: the key and the solutions appear after you submit. */
export async function loadResult(userId: string, attemptId: string): Promise<ResultView | null> {
  const first = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true, endsAt: true } });
  if (!first || first.userId !== userId) return null;
  if (first.status === "IN_PROGRESS") {
    if (first.endsAt.getTime() + GRACE_MS >= Date.now()) return null;
    await finalizeAttempt(attemptId);
  }
  const att = await db.mockAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { mock: { include: { questions: { include: { section: true }, orderBy: { number: "asc" } } } }, responses: true } });
  const analysis = analyse(att.mock.questions.map(toQInfo), att.responses.map(toRInfo), att.mock.durationMin * 60);
  // How everyone else did on each question, once enough people have taken it (never from one or two attempts).
  const others = await db.mockAttempt.findMany({ where: { mockId: att.mockId, status: "SUBMITTED", id: { not: attemptId } }, select: { score: true, responses: { select: { questionId: true, choice: true } } } });
  const key = new Map(att.mock.questions.map((q) => [q.id, q.correct]));
  const tally = new Map<string, { n: number; right: number }>();
  for (const o of others) for (const r of o.responses) { if (r.choice === null) continue; const t = tally.get(r.questionId) ?? { n: 0, right: 0 }; t.n++; if (r.choice === key.get(r.questionId)) t.right++; tally.set(r.questionId, t); }
  const scores = others.map((o) => o.score).filter((s): s is number => s !== null);
  return {
    attemptId, mock: { slug: att.mock.slug, title: att.mock.title, isTest: att.mock.isTest, durationMin: att.mock.durationMin }, submittedAt: att.submittedAt, tabSwitches: att.tabSwitches, analysis,
    questions: att.mock.questions.map((q) => { const t = tally.get(q.id); return { id: q.id, number: q.number, sectionName: q.section.name, topic: q.topic, stem: q.stem, context: q.context, options: q.options, correct: q.correct, explanation: q.explanation, cohortN: t?.n ?? 0, cohortCorrectPct: t && t.n >= MIN_COHORT_FOR_QUESTION_STATS ? Math.round((t.right / t.n) * 100) : null }; }),
    cohort: { attempts: others.length + 1, avgScore: scores.length >= 3 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null, percentile: att.score === null ? null : percentile(att.score, scores) },
  };
}
