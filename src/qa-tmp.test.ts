import fs from "node:fs";
import { it } from "vitest";
import { db } from "@/lib/db";
import { parseMockDocx } from "@/lib/mock-docx";
import { createMockFromParsed } from "@/server/mock-import";
import { loadExam, loadResult, saveResponse, submitAttempt } from "@/server/mocks";
import { renderMockReport } from "@/server/mock-report-pdf";

const DL = "/Users/samrudhdhaimodkar/Downloads/";
const FILES = ["SNAP_2026_Mock_11.docx", "SNAP_2026_Mock_12_Advanced.docx", "SNAP_2026_Mock_13_Easy.docx", "SNAP_2026_Mock_14_Medium.docx", "SNAP_2026_Mock_15_Hard.docx", "SNAP_2026_Mock_16.docx"];
const KEYS: Record<string, Record<string, number>> = JSON.parse(fs.readFileSync("/tmp/keys.json", "utf8"));
let fails = 0, checks = 0;
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) { fails++; console.log("   FAIL:", msg); } };
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

async function main() {
  const user = await db.user.findUniqueOrThrow({ where: { email: "student@demo.convertclub.test" } });
  for (const [idx, f] of FILES.entries()) {
    if (idx < Number(process.env.QA_FROM ?? 0)) continue;
    const key = KEYS[f];
    const parsed = parseMockDocx(new Uint8Array(fs.readFileSync(DL + f)));
    const slug = `qa-verify-${idx}`;
    await db.mock.deleteMany({ where: { slug } });
    const mock = await createMockFromParsed(parsed, { slug, title: `QA ${f}`, durationMin: 60, isTest: false, sortOrder: 900 + idx, status: "DRAFT", releaseAt: null, marks: 1, negative: 0.25 });
    const qs = await db.mockQuestion.findMany({ where: { mockId: mock.id }, orderBy: { number: "asc" } });
    console.log(`\n${f}: ${qs.length} questions`);

    // 1. what the student's browser receives must never carry the key or the solutions
    const exam = await loadExam(user.id, slug, { preview: true });
    const payload = JSON.stringify(exam!.mock.sections);
    ok(!/"correct"|"explanation"/.test(payload), "exam payload leaks correct/explanation keys");
    ok(!qs.some((q) => q.explanation && payload.includes(q.explanation.slice(0, 60))), "exam payload contains a solution");

    const scenarios: { name: string; pick: (n: number, correct: number) => number | null; expect: (n: number) => "right" | "wrong" | "blank" }[] = [
      { name: "all right", pick: (_n, c) => c, expect: () => "right" },
      { name: "all wrong", pick: (_n, c) => (c + 1) % 4, expect: () => "wrong" },
      { name: "all blank", pick: () => null, expect: () => "blank" },
    ];
    // a seeded mixed attempt, with expected outcomes computed from the INDEPENDENT key (not the database)
    const mixed: Record<number, number | null> = {};
    for (const q of qs) { const r = rnd(); mixed[q.number] = r < 0.45 ? key[q.number] : r < 0.75 ? (key[q.number] + 1 + Math.floor(rnd() * 3)) % 4 : null; }
    scenarios.push({ name: "mixed", pick: (n) => mixed[n], expect: (n) => (mixed[n] === null ? "blank" : mixed[n] === key[n] ? "right" : "wrong") });

    for (const sc of scenarios) {
      await db.mockAttempt.deleteMany({ where: { userId: user.id, mockId: mock.id } });
      const now = Date.now();
      const att = await db.mockAttempt.create({ data: { userId: user.id, mockId: mock.id, startedAt: new Date(now), endsAt: new Date(now + 3600_000) } });
      // the first three go through the real save path; the rest are written in one batch (hundreds of round trips otherwise)
      for (const q of qs.slice(0, 3)) await saveResponse(user.id, att.id, { questionId: q.id, choice: sc.pick(q.number, key[q.number]), marked: q.number % 7 === 0, timeSecDelta: 30 });
      await db.mockResponse.createMany({ data: qs.slice(3).map((q) => ({ attemptId: att.id, questionId: q.id, choice: sc.pick(q.number, key[q.number]), marked: q.number % 7 === 0, visited: true, timeSec: sc.name === "mixed" ? 20 + Math.floor(rnd() * 90) : 30, changes: 0 })) });
      await submitAttempt(user.id, att.id);
      const r = (await loadResult(user.id, att.id))!;
      const exp = qs.map((q) => sc.expect(q.number));
      const right = exp.filter((e) => e === "right").length, wrong = exp.filter((e) => e === "wrong").length, blank = exp.filter((e) => e === "blank").length;
      const score = Math.round((right - wrong * 0.25) * 100) / 100;
      const a = r.analysis;
      const stored = await db.mockAttempt.findUniqueOrThrow({ where: { id: att.id } });
      ok(a.score === score && stored.score === score, `${sc.name}: score ${a.score}/${stored.score} expected ${score}`);
      ok(a.correct === right && a.wrong === wrong && a.skipped === blank, `${sc.name}: counts ${a.correct}/${a.wrong}/${a.skipped} expected ${right}/${wrong}/${blank}`);
      ok(stored.correctCount === right && stored.wrongCount === wrong && stored.skippedCount === blank, `${sc.name}: stored counts differ`);
      ok(a.maxScore === 60, `${sc.name}: max score ${a.maxScore}`);
      ok(a.results.every((x, i) => x.outcome === (exp[i] === "right" ? "correct" : exp[i] === "wrong" ? "wrong" : "skipped")), `${sc.name}: some question outcomes differ`);
      ok(r.questions.every((q) => q.correct === key[q.number]), `${sc.name}: review key differs from the independent key`);
      ok(r.questions.every((q) => (q.explanation ?? "").length > 20), `${sc.name}: a question has no explanation`);
      ok(a.bySection.reduce((n, s) => n + s.b.total, 0) === 60 && a.bySection.reduce((n, s) => n + s.b.correct, 0) === right, `${sc.name}: section totals off`);
      ok(Math.abs(a.bySection.reduce((n, s) => n + s.b.score, 0) - score) < 0.001, `${sc.name}: section scores don't add up to the total`);
      ok(a.byTopic.reduce((n, t) => n + t.b.total, 0) === 60 && a.byArea.reduce((n, t) => n + t.b.total, 0) === 60, `${sc.name}: topic/area totals off`);
      const missed = new Set(a.results.filter((x) => x.outcome !== "correct").map((x) => x.number));
      ok(Object.values(a.misses).flat().every((n) => missed.has(n)) && Object.values(a.misses).flat().length === missed.size, `${sc.name}: 'why marks were lost' covers ${Object.values(a.misses).flat().length} of ${missed.size}`);
      ok(a.negativeLost === wrong * 0.25, `${sc.name}: negative lost ${a.negativeLost}`);
      ok(a.timeUsedSec <= 3600, `${sc.name}: time used ${a.timeUsedSec} exceeds the paper`);
      ok(a.accuracy === (right + wrong ? Math.round((right / (right + wrong)) * 1000) / 10 : 0), `${sc.name}: accuracy ${a.accuracy}`);
      if (sc.name === "mixed" || sc.name === "all right") {
        const pdf = await renderMockReport(r, { name: "QA Student", email: "qa@example.com" });
        const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
        ok(pdf.subarray(0, 4).toString() === "%PDF" && pages >= 10, `${sc.name}: PDF ${pdf.length} bytes, ${pages} pages`);
        if (sc.name === "mixed") console.log(`   PDF ok: ${pages} pages, ${(pdf.length / 1024).toFixed(0)} KB`);
      }
      console.log(`   ${sc.name.padEnd(9)} right ${a.correct} wrong ${a.wrong} blank ${a.skipped} -> score ${a.score}  (expected ${score})`);
    }
    await db.mockAttempt.deleteMany({ where: { mockId: mock.id } });
    await db.mock.delete({ where: { id: mock.id } });
  }
  console.log(`\n${checks} checks, ${fails} failures`);
}
it("full pipeline on all six papers", async () => { await main(); if (fails) throw new Error(fails + " checks failed"); }, 900_000);
