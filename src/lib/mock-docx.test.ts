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
    expect(r.problems).toContain("Q1: 2 options");
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
});
