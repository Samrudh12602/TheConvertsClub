/**
 * Imports one mock from the JSON written by scripts/mock-docx-to-json.py into the database.
 *   npx tsx --env-file=.env.local scripts/import-mock.ts <file.json> --slug snap-test-mock --test --order 0 [--publish] [--release 2026-10-20T10:00]
 * Re-running with the same slug replaces the questions, but only while nobody has attempted the mock.
 * The paper is never committed: keep the JSON outside the repository.
 */
import fs from "node:fs";
import { db } from "../src/lib/db";
import { topicFor } from "../src/lib/mock-topics";

function arg(name: string) { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; }
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const file = process.argv[2];
  const slug = arg("slug");
  if (!file || !slug) throw new Error("usage: import-mock.ts <file.json> --slug <slug> [--title ..] [--test] [--order n] [--publish] [--release ISO]");
  const j = JSON.parse(fs.readFileSync(file, "utf8")) as { title: string; problems: string[]; sections: { name: string; questions: { number: number; stem: string; options: string[]; correct: number; explanation?: string | null; context?: unknown }[] }[] };
  if (j.problems.length) throw new Error("the paper has problems:\n" + j.problems.join("\n"));
  const existing = await db.mock.findUnique({ where: { slug }, include: { _count: { select: { attempts: true } } } });
  if (existing && existing._count.attempts > 0) throw new Error("this mock already has attempts; refusing to replace its questions");
  if (existing) await db.mock.delete({ where: { id: existing.id } });
  const total = j.sections.reduce((n, s) => n + s.questions.length, 0);
  const mock = await db.mock.create({
    data: {
      slug, title: arg("title") ?? j.title, durationMin: Number(arg("duration") ?? 60), isTest: flag("test"), sortOrder: Number(arg("order") ?? 0),
      status: flag("publish") ? "PUBLISHED" : "DRAFT", releaseAt: arg("release") ? new Date(arg("release")!) : null,
      description: arg("description") ?? `${total} questions, ${arg("duration") ?? 60} minutes, +1 for a right answer and −0.25 for a wrong one, in the SNAP exam format.`,
    },
  });
  let tagged = 0;
  for (const [si, s] of j.sections.entries()) {
    const sec = await db.mockSection.create({ data: { mockId: mock.id, name: s.name, sortOrder: si } });
    for (const q of s.questions) {
      const ctxText = Array.isArray((q.context as { lines?: string[] } | null)?.lines) ? ((q.context as { lines: string[] }).lines.join(" ")) : "";
      const topic = topicFor(s.name, `${ctxText} ${q.stem}`, q.number);
      if (topic !== s.name.replace(/&/g, "and").replace(/\s+/g, " ").trim()) tagged++;
      await db.mockQuestion.create({ data: { mockId: mock.id, sectionId: sec.id, number: q.number, stem: q.stem, context: (q.context as object | null) ?? undefined, options: q.options, correct: q.correct, explanation: q.explanation ?? null, topic } });
    }
  }
  console.log(`imported "${mock.title}" as ${slug}: ${total} questions, ${tagged} tagged with a topic, status ${mock.status}`);
  const rows = await db.mockQuestion.findMany({ where: { mockId: mock.id }, orderBy: { number: "asc" }, select: { number: true, topic: true } });
  console.log(rows.map((r) => `${r.number}:${r.topic}`).join(" | "));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
