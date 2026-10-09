/**
 * Imports one mock from the JSON written by scripts/mock-docx-to-json.py into the database.
 *   npx tsx --env-file=.env.local scripts/import-mock.ts <file.json> --slug snap-test-mock --test --order 0 [--publish] [--release 2026-10-20T10:00]
 * Re-running with the same slug replaces the questions, but only while nobody has attempted the mock.
 * Most of the time you don't need this: Admin > SNAP mocks takes the .docx directly.
 * The paper is never committed: keep the JSON outside the repository.
 */
import fs from "node:fs";
import type { ParsedMock } from "../src/lib/mock-docx";
import { createMockFromParsed } from "../src/server/mock-import";

function arg(name: string) { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; }
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const file = process.argv[2];
  const slug = arg("slug");
  if (!file || !slug) throw new Error("usage: import-mock.ts <file.json> --slug <slug> [--title ..] [--test] [--order n] [--publish] [--release ISO]");
  const j = JSON.parse(fs.readFileSync(file, "utf8")) as ParsedMock;
  const mock = await createMockFromParsed(j, {
    slug, title: arg("title") ?? j.title ?? slug, description: arg("description") ?? null, durationMin: Number(arg("duration") ?? 60), isTest: flag("test"), sortOrder: Number(arg("order") ?? 0),
    status: flag("publish") ? "PUBLISHED" : "DRAFT", releaseAt: arg("release") ? new Date(arg("release")!) : null, marks: 1, negative: 0.25,
  }, { replaceSlug: true });
  console.log(`imported "${mock.title}" as ${slug}: ${j.total} questions, status ${mock.status}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
