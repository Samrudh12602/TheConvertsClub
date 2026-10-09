import { unzipSync, strFromU8 } from "fflate";

/**
 * Reads a SNAP mock paper (.docx: question paper + answer key + detailed solutions) into the shape the importer stores.
 * Pure: no database, no network. It is a port of scripts/mock-docx-to-json.py, and the two must agree.
 *
 * Expected layout:
 *   Section N: <name>                      starts a section
 *   Qn.  <text>                            starts a question (more lines may follow as the stem)
 *   (a)  <text> ... (d)  <text>            the four options
 *   Directions (Questions a-b): <text>     a shared passage/data set for a range of questions; a table may follow it
 *   Answer Key                             then a grid table of  Q | Ans  (or  Q | Ans | Level)  groups
 *   Detailed Solutions                     then  Qn.  [Level]  Answer: (x)  <text>  and the explanation paragraphs
 */

export interface ParsedQuestion { number: number; stem: string; options: string[]; correct: number; explanation: string | null; context: { lines: string[]; table: string[][] | null } | null }
export interface ParsedSection { name: string; questions: ParsedQuestion[] }
export interface ParsedMock { title: string | null; sections: ParsedSection[]; problems: string[]; total: number }

const SECTION = /^Section\s+(\d+)\s*:\s*(.+)$/;
const QSTART = /^Q(\d+)\.\s+([\s\S]*)$/;
const OPTION = /^\(([a-d])\)\s+([\s\S]*)$/;
const SETDIR = /^Directions\s*\(Questions?\s*(\d+)\s*[–—-]\s*(\d+)\)\s*:\s*([\s\S]*)$/;
const SOLUTION = /^Q(\d+)\.\s+(?:\[[^\]]*\]\s*)?Answer:\s*\(([a-d])\)\s*([\s\S]*)$/;
const LETTER = "abcd";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, g: string) => {
  if (g[0] === "#") { const n = g[1] === "x" || g[1] === "X" ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENTITIES[g] ?? m;
});

/** The text of one <w:p>…</w:p>, the way Word shows it (tabs and line breaks kept). */
function paragraphText(xml: string): string {
  let out = "";
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\s*\/>|<w:br\b([^>]*)\/?>|<w:cr\s*\/>|<w:noBreakHyphen\s*\/>/g;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    if (m[1] !== undefined) out += decode(m[1]);
    else if (m[0].startsWith("<w:tab")) out += "\t";
    else if (m[0].startsWith("<w:br")) { if (!/w:type="(page|column)"/.test(m[2] ?? "")) out += "\n"; }
    else if (m[0].startsWith("<w:cr")) out += "\n";
    else out += "-";
  }
  return out;
}

type Block = { kind: "p"; text: string } | { kind: "tbl"; rows: string[][] };

function paragraphsIn(xml: string): string[] {
  const out: string[] = [];
  const re = /<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g;
  for (let m = re.exec(xml); m; m = re.exec(xml)) out.push(paragraphText(m[1] ?? ""));
  return out;
}

function tableRows(xml: string): string[][] {
  const rows: string[][] = [];
  const rowRe = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g;
  for (let r = rowRe.exec(xml); r; r = rowRe.exec(xml)) {
    const cells: string[] = [];
    const cellRe = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g;
    for (let c = cellRe.exec(r[1]); c; c = cellRe.exec(r[1])) {
      const span = /<w:gridSpan\s+w:val="(\d+)"/.exec(c[1]);
      const text = paragraphsIn(c[1]).join("\n").trim();
      for (let k = 0; k < (span ? Math.max(1, parseInt(span[1], 10)) : 1); k++) cells.push(text);
    }
    rows.push(cells);
  }
  return rows;
}

/** The body's paragraphs and tables, in document order (a table's own paragraphs belong to the table). */
function blocks(documentXml: string): Block[] {
  const body = /<w:body\b[^>]*>([\s\S]*)<\/w:body>/.exec(documentXml)?.[1] ?? documentXml;
  const out: Block[] = [];
  const re = /<w:(p|tbl)\b[^>]*?(\/>|>)/g;
  let i = 0;
  while (i < body.length) {
    re.lastIndex = i;
    const m = re.exec(body);
    if (!m) break;
    const tag = m[1];
    if (m[2] === "/>") { out.push({ kind: "p", text: "" }); i = re.lastIndex; continue; }
    const close = `</w:${tag}>`;
    let end: number;
    if (tag === "p") end = body.indexOf(close, re.lastIndex);
    else { // a table can hold another table: match the closing tag by depth
      let depth = 1, pos = re.lastIndex;
      const t = /<(\/?)w:tbl\b[^>]*?(\/?)>/g;
      end = -1;
      for (t.lastIndex = pos; ; ) { const x = t.exec(body); if (!x) break; if (x[2] === "/") continue; depth += x[1] ? -1 : 1; if (depth === 0) { end = x.index; break; } }
      pos = 0;
    }
    if (end < 0) break;
    const inner = body.slice(re.lastIndex, end);
    out.push(tag === "p" ? { kind: "p", text: paragraphText(inner) } : { kind: "tbl", rows: tableRows(inner) });
    i = end + close.length;
  }
  return out;
}

export class DocxError extends Error {}

export function parseMockDocx(bytes: Uint8Array): ParsedMock {
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" }); } catch { throw new DocxError("That doesn't look like a Word (.docx) file."); }
  const doc = files["word/document.xml"];
  if (!doc) throw new DocxError("That doesn't look like a Word (.docx) file.");
  const items = blocks(strFromU8(doc));

  let title: string | null = null;
  const sections: { name: string; questions: Partial<ParsedQuestion> & { stem: string[]; options: string[] }[] }[] = [];
  type Q = { number: number; stem: string[]; options: string[]; context: { lines: string[]; table: string[][] | null } | null };
  const secs: { name: string; questions: Q[] }[] = [];
  void sections;
  let curSec: { name: string; questions: Q[] } | null = null;
  let curQ: Q | null = null;
  let setCtx: { from: number; to: number; context: { lines: string[]; table: string[][] | null } } | null = null;
  const key = new Map<number, number>();
  const sols = new Map<number, { answer: number; lines: string[] }>();
  let curSol: { answer: number; lines: string[] } | null = null;
  let phase: "paper" | "key" | "solutions" = "paper";
  const closeQ = () => { if (curQ && curSec) curSec.questions.push(curQ); curQ = null; };

  for (const it of items) {
    if (it.kind === "tbl") {
      const rows = it.rows;
      const head = rows[0]?.map((c) => c.toLowerCase()) ?? [];
      if (phase === "key" && rows.length && head[0] === "q" && head[1] === "ans") {
        const width = head.includes("level") ? 3 : 2;
        for (const r of rows.slice(1)) for (let i = 0; i < r.length - 1; i += width) {
          const n = r[i].trim(), a = r[i + 1].trim().toLowerCase();
          if (/^\d+$/.test(n) && LETTER.includes(a) && a.length === 1) key.set(Number(n), LETTER.indexOf(a));
        }
      } else if (phase === "paper" && rows.length && head[0] === "section") {
        // the summary table at the top
      } else if (phase === "paper") {
        const target = setCtx && curQ === null ? setCtx : curQ;
        if (target) {
          if (target.context) target.context.table = rows;
          else (target as Q).context = { lines: [], table: rows };
        }
      }
      continue;
    }
    const raw = it.text.replace(/\s+$/, "");
    const s = raw.trim();
    if (!s) continue;
    if (title === null && phase === "paper" && s.includes("Mock")) title = s;
    if (s === "Answer Key" && phase === "paper") { closeQ(); phase = "key"; continue; }
    if (s === "Detailed Solutions") { phase = "solutions"; continue; }
    if (phase === "paper") {
      let m = SECTION.exec(s);
      if (m) { closeQ(); setCtx = null; curSec = { name: m[2].trim(), questions: [] }; secs.push(curSec); continue; }
      if (!curSec) continue;
      m = SETDIR.exec(s);
      if (m) { closeQ(); setCtx = { from: Number(m[1]), to: Number(m[2]), context: { lines: [s], table: null } }; continue; }
      m = QSTART.exec(s);
      if (m) {
        closeQ();
        const n = Number(m[1]);
        let ctx: Q["context"] = null;
        if (setCtx && setCtx.from <= n && n <= setCtx.to) ctx = JSON.parse(JSON.stringify(setCtx.context));
        else if (setCtx && n > setCtx.to) setCtx = null;
        curQ = { number: n, stem: [m[2]], options: [], context: ctx };
        continue;
      }
      m = OPTION.exec(s);
      if (m && curQ) { curQ.options.push(m[2].trim()); continue; }
      if (curQ && curQ.options.length === 0) curQ.stem.push(raw.replace(/^\n+|\n+$/g, ""));
      else if (!curQ && setCtx) setCtx.context.lines.push(s);
    } else if (phase === "solutions") {
      if (SECTION.test(s)) continue;
      const m = SOLUTION.exec(s);
      if (m) { curSol = { answer: LETTER.indexOf(m[2]), lines: [] }; sols.set(Number(m[1]), curSol); continue; }
      if (curSol) curSol.lines.push(s);
    }
  }
  closeQ();

  const problems: string[] = [];
  let total = 0;
  const out: ParsedSection[] = secs.map((sec) => ({
    name: sec.name,
    questions: sec.questions.map((q) => {
      const n = q.number; total++;
      if (q.options.length !== 4) problems.push(`Q${n}: ${q.options.length} options`);
      if (!key.has(n)) problems.push(`Q${n}: no answer in the key`);
      const sol = sols.get(n);
      if (!sol) problems.push(`Q${n}: no solution`);
      else if (key.has(n) && sol.answer !== key.get(n)) problems.push(`Q${n}: key says ${LETTER[key.get(n)!]} but the solution says ${LETTER[sol.answer]}`);
      const correct = key.get(n) ?? sol?.answer ?? 0;
      return { number: n, stem: q.stem.join("\n").trim(), options: q.options, correct, explanation: sol ? (sol.lines.join("\n").trim() || null) : null, context: q.context };
    }),
  }));
  const nums = out.flatMap((s) => s.questions.map((q) => q.number)).sort((a, b) => a - b);
  if (nums.some((n, i) => n !== i + 1)) problems.push(`question numbers are not 1..${nums.length}: ${nums.slice(0, 5).join(", ")}...`);
  if (out.length === 0) problems.push("No sections found. Each section should start with a line like “Section 1: General English”.");
  return { title, sections: out, problems, total };
}
