#!/usr/bin/env python3
"""
Turns a SNAP mock .docx (question paper + answer key + detailed solutions) into JSON for scripts/import-mock.ts.

Expected layout (what the owner's papers use):
  Section N: <name>                      starts a section
  Qn.  <text>                            starts a question (more lines may follow as the stem)
  (a)  <text> ... (d)  <text>            the four options
  Directions (Questions a-b): <text>     a shared passage/data set for a range of questions; a table may follow it
  Answer Key                             then a grid table of  Q | Ans  pairs
  Detailed Solutions                     then  Qn.  Answer: (x)  <text>  followed by the explanation paragraphs

The JSON goes to stdout. It is written to a file the owner keeps outside the repository: the paper is the product.
"""
import json, re, sys
import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

SECTION = re.compile(r"^Section\s+(\d+)\s*:\s*(.+)$")
QSTART = re.compile(r"^Q(\d+)\.\s+(.*)$")
OPTION = re.compile(r"^\(([a-d])\)\s+(.*)$")
SETDIR = re.compile(r"^Directions\s*\(Questions?\s*(\d+)\s*[–—-]\s*(\d+)\)\s*:\s*(.*)$")
SOLUTION = re.compile(r"^Q(\d+)\.\s+Answer:\s*\(([a-d])\)\s*(.*)$")
LETTER = "abcd"


def body_items(d):
    for el in d.element.body.iterchildren():
        tag = el.tag.split("}")[1]
        if tag == "p":
            yield Paragraph(el, d)
        elif tag == "tbl":
            yield Table(el, d)


def table_rows(t):
    return [[c.text.strip() for c in r.cells] for r in t.rows]


def main(path):
    d = docx.Document(path)
    title = None
    sections, cur_sec, cur_q, set_ctx = [], None, None, None
    key, sols, cur_sol = {}, {}, None
    phase = "paper"  # paper -> key -> solutions

    def close_q():
        nonlocal cur_q
        if cur_q is not None and cur_sec is not None:
            cur_sec["questions"].append(cur_q)
        cur_q = None

    for it in body_items(d):
        if isinstance(it, Table):
            rows = table_rows(it)
            head = [c.lower() for c in rows[0]] if rows else []
            if phase == "key" and rows and head[:2] == ["q", "ans"]:
                for r in rows[1:]:
                    for i in range(0, len(r) - 1, 2):
                        if r[i].strip().isdigit() and r[i + 1].strip().lower() in LETTER:
                            key[int(r[i])] = LETTER.index(r[i + 1].strip().lower())
            elif phase == "paper" and rows and head[:1] == ["section"]:
                pass  # the summary table at the top
            elif phase == "paper":
                target = set_ctx if (set_ctx and cur_q is None) else (cur_q if cur_q is not None else None)
                if target is not None:
                    if "context" in target:
                        target["context"]["table"] = rows
                    else:
                        target["context"] = {"lines": [], "table": rows}
            continue
        text = it.text.rstrip()
        s = text.strip()
        if not s:
            continue
        if title is None and phase == "paper" and "Mock" in s:
            title = s
        if s == "Answer Key" and phase == "paper":
            close_q(); phase = "key"; continue
        if s == "Detailed Solutions":
            phase = "solutions"; continue
        if phase == "paper":
            m = SECTION.match(s)
            if m:
                close_q(); set_ctx = None
                cur_sec = {"name": m.group(2).strip(), "questions": []}
                sections.append(cur_sec)
                continue
            if cur_sec is None:
                continue
            m = SETDIR.match(s)
            if m:
                close_q()
                set_ctx = {"from": int(m.group(1)), "to": int(m.group(2)), "context": {"lines": [s], "table": None}}
                continue
            m = QSTART.match(s)
            if m:
                close_q()
                n = int(m.group(1))
                ctx = None
                if set_ctx and set_ctx["from"] <= n <= set_ctx["to"]:
                    ctx = json.loads(json.dumps(set_ctx["context"]))
                    if n == set_ctx["to"]:
                        pass
                elif set_ctx and n > set_ctx["to"]:
                    set_ctx = None
                cur_q = {"number": n, "stem": [m.group(2)], "options": [], "context": ctx}
                continue
            m = OPTION.match(s)
            if m and cur_q is not None:
                cur_q["options"].append(m.group(2).strip())
                continue
            if cur_q is not None and not cur_q["options"]:
                cur_q["stem"].append(text.strip("\n"))
            elif cur_q is None and set_ctx is not None:
                set_ctx["context"]["lines"].append(s)
        elif phase == "key":
            continue
        elif phase == "solutions":
            if SECTION.match(s):
                continue
            m = SOLUTION.match(s)
            if m:
                cur_sol = {"answer": LETTER.index(m.group(2)), "answerText": m.group(3).strip(), "lines": []}
                sols[int(m.group(1))] = cur_sol
                continue
            if cur_sol is not None:
                cur_sol["lines"].append(s)
    close_q()

    problems = []
    n_total = 0
    for sec in sections:
        for q in sec["questions"]:
            n = q["number"]; n_total += 1
            q["stem"] = "\n".join(q["stem"]).strip()
            if len(q["options"]) != 4:
                problems.append(f"Q{n}: {len(q['options'])} options")
            if n not in key:
                problems.append(f"Q{n}: no answer in the key")
            if n not in sols:
                problems.append(f"Q{n}: no solution")
            else:
                if n in key and sols[n]["answer"] != key[n]:
                    problems.append(f"Q{n}: key says {LETTER[key[n]]} but the solution says {LETTER[sols[n]['answer']]}")
                q["explanation"] = "\n".join(sols[n]["lines"]).strip() or None
            if n in key:
                q["correct"] = key[n]
            elif n in sols:
                q["correct"] = sols[n]["answer"]
    nums = sorted(q["number"] for s in sections for q in s["questions"])
    if nums != list(range(1, len(nums) + 1)):
        problems.append(f"question numbers are not 1..{len(nums)}: {nums[:5]}...")
    json.dump({"title": title, "sections": sections, "problems": problems, "total": n_total}, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1])
