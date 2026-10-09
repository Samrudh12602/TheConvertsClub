import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { DocxError, parseMockDocx } from "./mock-docx";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const p = (t: string) => `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
const tbl = (rows: string[][]) => `<w:tbl>${rows.map((r) => `<w:tr>${r.map((c) => `<w:tc>${p(c)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`;
const docx = (body: string) => zipSync({ "word/document.xml": strToU8(`<?xml version="1.0"?><w:document xmlns:w="x"><w:body>${body}</w:body></w:document>`) });

const paper = (extra = "") => docx([
  p("SNAP 2026"), p("Full-Length Mock Test 9"),
  p("Section 1: General English"),
  p("Directions (Questions 1–2): Read the passage."), p("The passage says a & b."),
  p("Q1.  First?"), p("(a)  one"), p("(b)  two"), p("(c)  three"), p("(d)  four"),
  p("Q2.  Second?"), p("(a)  w"), p("(b)  x"), p("(c)  y"), p("(d)  z"),
  p("Section 2: Quant"),
  p("Q3.  Third?"), tbl([["A", "B"], ["1", "2"]]), p("(a)  p"), p("(b)  q"), p("(c)  r"), p("(d)  s"),
  p("Answer Key"), tbl([["Q", "Ans", "Level", "Q", "Ans", "Level"], ["1", "B", "Easy", "3", "D", "Hard"], ["2", "a", "Easy", "", "", ""]]),
  p("Detailed Solutions"),
  p("Q1.  [Easy]  Answer: (b)  two"), p("Because two."),
  p("Q2.  [Easy]  Answer: (a)  w"), p("Because w."),
  p("Q3.  [Hard]  Answer: (d)  s"), p("Because s."), extra,
].join(""));

describe("parseMockDocx", () => {
  it("reads sections, shared passages, tables, the key and the solutions", () => {
    const r = parseMockDocx(paper());
    expect(r.problems).toEqual([]);
    expect(r.total).toBe(3);
    expect(r.title).toBe("Full-Length Mock Test 9");
    expect(r.sections.map((s) => [s.name, s.questions.length])).toEqual([["General English", 2], ["Quant", 1]]);
    const [q1, q2] = r.sections[0].questions;
    expect(q1.correct).toBe(1);
    expect(q2.correct).toBe(0);
    expect(q1.context?.lines.join(" ")).toContain("a & b");
    expect(q1.explanation).toBe("Because two.");
    expect(r.sections[1].questions[0].context?.table).toEqual([["A", "B"], ["1", "2"]]);
    expect(r.sections[1].questions[0].correct).toBe(3);
  });
  it("flags a missing solution and a key that disagrees with it", () => {
    const bad = docx([p("Section 1: A"), p("Q1.  x?"), p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"), p("Answer Key"), tbl([["Q", "Ans"], ["1", "A"]]), p("Detailed Solutions"), p("Q1.  Answer: (c)  3"), p("why")].join(""));
    expect(parseMockDocx(bad).problems.join(" ")).toMatch(/key says a but the solution says c/);
    const none = docx([p("Section 1: A"), p("Q1.  x?"), p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"), p("Answer Key"), tbl([["Q", "Ans"], ["1", "A"]])].join(""));
    expect(parseMockDocx(none).problems).toContain("Q1: no solution");
  });
  it("flags a question without four options", () => {
    const r = parseMockDocx(docx([p("Section 1: A"), p("Q1.  x?"), p("(a)  1"), p("(b)  2"), p("Answer Key"), tbl([["Q", "Ans"], ["1", "A"]]), p("Detailed Solutions"), p("Q1.  Answer: (a)  1")].join("")));
    expect(r.problems.join(" ")).toMatch(/Q1: 2 options/);
  });
  it("rejects a file that isn't a Word document", () => {
    expect(() => parseMockDocx(strToU8("not a zip"))).toThrow(DocxError);
    expect(() => parseMockDocx(zipSync({ "hello.txt": strToU8("hi") }))).toThrow(DocxError);
  });
  it("decodes entities and tabs", () => {
    const r = parseMockDocx(docx(`<w:p><w:r><w:t>Section 1: Ethics &amp; Values</w:t></w:r></w:p><w:p><w:r><w:t>Q1.  x</w:t><w:tab/><w:t>y</w:t></w:r></w:p>`));
    expect(r.sections[0].name).toBe("Ethics & Values");
    expect(r.sections[0].questions[0].stem).toBe("x\ty");
  });

  it("keeps underlined words, superscripts and subscripts", () => {
    const r = parseMockDocx(docx([
      p("Section 1: A"),
      `<w:p><w:r><w:t xml:space="preserve">Q1.  Pick the opposite of the underlined word: the </w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>ephemeral</w:t></w:r><w:r><w:t xml:space="preserve"> app, x</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t xml:space="preserve"> and H</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t>O</w:t></w:r></w:p>`,
      p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"),
    ].join("")));
    expect(r.sections[0].questions[0].stem).toBe("Pick the opposite of the underlined word: the <u>ephemeral</u> app, x² and H₂O");
  });
  it("merges an underline split over several runs and ignores 'no underline'", () => {
    const r = parseMockDocx(docx([
      p("Section 1: A"),
      `<w:p><w:r><w:t>Q1.  a </w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>well</w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>-known</w:t></w:r><w:r><w:rPr><w:u w:val="none"/></w:rPr><w:t> author</w:t></w:r></w:p>`,
      p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"),
    ].join("")));
    expect(r.sections[0].questions[0].stem).toBe("a <u>well-known</u> author");
  });
  it("warns, without blocking, about a solution that names a different answer than the option", () => {
    const r = parseMockDocx(paper().length ? docx([
      p("Section 1: A"), p("Q1.  x?"), p("(a)  alpha"), p("(b)  beta"), p("(c)  gamma"), p("(d)  delta"),
      p("Answer Key"), tbl([["Q", "Ans"], ["1", "B"]]), p("Detailed Solutions"), p("Q1.  Answer: (b)  gamma"), p("Why C: because. Why not B: no."),
    ].join("")) : new Uint8Array());
    expect(r.problems).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/names “gamma”/);
    expect(r.warnings.join(" ")).toMatch(/Why C/);
    expect(r.warnings.join(" ")).toMatch(/Why not B/);
  });
  it("warns about a picture or an equation, and about bunched answers", () => {
    const body = [p("Section 1: A")];
    const rows: string[][] = [["Q", "Ans"]];
    const sols: string[] = [];
    for (let i = 1; i <= 20; i++) {
      body.push(p(`Q${i}.  q${i}?`), p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"));
      if (i === 3) body.push(`<w:p><w:r><w:drawing/></w:r></w:p>`);
      rows.push([String(i), "B"]);
      sols.push(p(`Q${i}.  Answer: (b)  2`), p("because"));
    }
    const r = parseMockDocx(docx(body.join("") + p("Answer Key") + tbl(rows) + p("Detailed Solutions") + sols.join("")));
    expect(r.problems).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/Pictures or Word equations found in Q3/);
    expect(r.warnings.join(" ")).toMatch(/Answers are bunched/);
    expect(r.warnings.join(" ")).toMatch(/real SNAP has 60/);
  });
  it("blocks an empty option, a missing key and a repeated question number", () => {
    const empty = parseMockDocx(docx([p("Section 1: A"), p("Q1.  x?"), p("(a)  1"), p("(b)  "), p("(c)  3"), p("(d)  4")].join("")));
    expect(empty.problems.join(" ")).toMatch(/Q1/);
    const dup = parseMockDocx(docx([p("Section 1: A"), p("Q1.  x?"), p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4"), p("Q1.  y?"), p("(a)  1"), p("(b)  2"), p("(c)  3"), p("(d)  4")].join("")));
    expect(dup.problems.join(" ")).toMatch(/question numbers/);
  });
});

