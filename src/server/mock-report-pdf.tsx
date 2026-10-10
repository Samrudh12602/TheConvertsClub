import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { MISS_LABEL, mmss, paceSec, type MissKind } from "@/lib/mock-analysis";
import type { ResultView } from "@/server/mocks";
import { splitRich, type RichPart } from "@/lib/rich";

const C = { ink: "#16130F", body: "#3A332B", muted: "#6F655A", line: "#E4DED4", soft: "#F7F4EE", oxblood: "#7A1F2B", tint: "#F5E9EA", green: "#14664F", greenTint: "#E3F1EE", amber: "#9A6A12", amberTint: "#FAF0D8" };

/**
 * react-pdf's built-in Helvetica has no glyph for many maths and typographic characters (a minus sign, >=, superscript digits,
 * Greek letters, a rupee sign): they silently vanish. This turns them into readable ASCII so a solution never loses a symbol.
 */
const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-" };
const SUB: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
const MAP: Record<string, string> = { "−": "-", "–": "-", "—": "-", "≥": ">=", "≤": "<=", "≠": "!=", "≈": "~", "→": "->", "←": "<-", "⇒": "=>", "√": "sqrt", "π": "pi", "θ": "theta", "α": "alpha", "β": "beta", "γ": "gamma", "Δ": "Delta", "∠": "angle ", "∴": "so", "∵": "since", "∞": "infinity", "₹": "Rs.", "✓": "(right)", "✗": "(wrong)", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "•": "-", "·": "-", " ": " ", "‑": "-", "≡": "==", "∈": "in", "∪": "U", "∩": "n", "⊂": "subset of", "°": " deg" };
export function pdfSafe(input: string | null | undefined): string {
  let out = "";
  let supRun = false;
  for (const ch of input ?? "") {
    if (SUP[ch] !== undefined) { out += (supRun ? "" : "^") + SUP[ch]; supRun = true; continue; }
    supRun = false;
    if (SUB[ch] !== undefined) { out += SUB[ch]; continue; }
    out += MAP[ch] ?? ch;
  }
  // (Do not set lineHeight on the page: react-pdf's layout crashes with 'unsupported number' on a long paper that page-breaks mid-block.)
  // Anything still outside basic Latin and Latin-1 would render as nothing.
  return out.replace(/[^\u0009\u000a -~¡-ÿ]/g, "");
}

/** Text parts with <u>underlined</u> words drawn as real underlines (a picture inside plain text becomes "[figure]"). */
const richParts = (parts: RichPart[]) => parts.map((p, i) => (p.image ? "[figure]" : p.underline ? <Text key={i} style={{ textDecoration: "underline" }}>{pdfSafe(p.text)}</Text> : pdfSafe(p.text)));
const rich = (t: string | null | undefined) => richParts(splitRich(t));

/** A picture ready for the PDF: PNG or JPEG bytes and the size it is drawn at, in points. */
export interface PdfImage { data: Buffer; format: "png" | "jpg"; w: number; h: number }
export type PdfImages = Map<string, PdfImage>;

/** Natural pixel size of a PNG or JPEG, so a picture is drawn in proportion and never taller than a page can hold. */
export function imageSize(b: Uint8Array): { w: number; h: number } | null {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19], h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23] };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length; ) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
}
/** Where a picture's size comes from: the width it had in Word if known, else its own pixels; at most 400 x 250 points. */
export function fitImage(natural: { w: number; h: number } | null, wordWidthPx: number | null): { w: number; h: number } {
  const ratio = natural && natural.w > 0 ? natural.h / natural.w : 0.6;
  let w = Math.min(400, (wordWidthPx ?? (natural ? natural.w : 320)) * 0.75);
  let h = w * ratio;
  if (h > 250) { h = 250; w = h / ratio; }
  return { w: Math.max(40, w), h: Math.max(30, h) };
}

/** Text that may hold pictures: text and pictures alternate as blocks. Without a picture it is a single Text, as before. */
function PdfRich({ text, imgs, suffix, style }: { text: string | null | undefined; imgs: PdfImages; suffix?: string; style?: { fontFamily?: string; marginBottom?: number } }) {
  const parts = splitRich(text);
  if (!parts.some((p) => p.image)) return <Text style={style}>{richParts(parts)}{suffix}</Text>;
  const out: React.ReactNode[] = [];
  let buf: RichPart[] = [];
  const flush = (last = false) => { if (buf.length || (last && suffix)) out.push(<Text key={`t${out.length}`} style={style}>{richParts(buf)}{last ? suffix : ""}</Text>); buf = []; };
  for (const p of parts) {
    if (!p.image) { buf.push(p); continue; }
    flush();
    const im = imgs.get(p.image.id);
    const size = im ? fitImage({ w: im.w, h: im.h }, p.image.width) : null;
    /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt text */
    out.push(im && size ? <Image key={`i${out.length}`} src={{ data: im.data, format: im.format }} style={{ width: size.w, height: size.h, marginVertical: 4 }} /> : <Text key={`i${out.length}`} style={style}>[figure]</Text>);
  }
  flush(true);
  return <View>{out}</View>;
}

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 46, paddingHorizontal: 38, fontSize: 9.5, color: C.body, fontFamily: "Helvetica" },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  mark: { width: 22, height: 22, backgroundColor: C.oxblood, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  markT: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 11 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, color: C.ink, marginLeft: 7 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 19, color: C.ink },
  sub: { fontSize: 9.5, color: C.muted, marginTop: 3 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 12, color: C.ink, marginTop: 16, marginBottom: 6 },
  cards: { flexDirection: "row", gap: 8, marginTop: 12 },
  card: { flexGrow: 1, flexBasis: 0, backgroundColor: C.soft, borderRadius: 6, padding: 9 },
  cardL: { fontSize: 7.5, color: C.muted, letterSpacing: 0.6 },
  cardV: { fontFamily: "Helvetica-Bold", fontSize: 16, color: C.ink, marginTop: 3 },
  table: { borderWidth: 0.7, borderColor: C.line, borderRadius: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: C.line },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: C.muted, padding: 5, backgroundColor: C.soft },
  td: { fontSize: 9, padding: 5 },
  note: { fontSize: 8.5, color: C.muted, marginTop: 6 },
  miss: { borderWidth: 0.7, borderColor: C.line, borderRadius: 5, padding: 8, marginBottom: 6 },
  missT: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.ink },
  q: { borderWidth: 0.7, borderColor: C.line, borderRadius: 6, padding: 10, marginBottom: 9 },
  qHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  qNo: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: C.ink },
  qMeta: { fontSize: 8, color: C.muted },
  chip: { fontFamily: "Helvetica-Bold", fontSize: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8 },
  opt: { flexDirection: "row", marginTop: 3, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },
  optL: { width: 16, fontFamily: "Helvetica-Bold" },
  sol: { marginTop: 7, backgroundColor: C.soft, borderRadius: 4, padding: 7 },
  solL: { fontFamily: "Helvetica-Bold", fontSize: 8, color: C.muted, letterSpacing: 0.6, marginBottom: 2 },
  footer: { position: "absolute", bottom: 18, left: 38, right: 38, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
});

const LET = ["A", "B", "C", "D", "E"];
const marks = (n: number) => String(Math.round(n * 100) / 100);

function Report({ r, student, only, imgs }: { r: ResultView; student: { name: string; email: string }; only?: "summary" | "solutions"; imgs: PdfImages }) {
  const a = r.analysis;
  const pace = paceSec(r.mock.durationMin * 60, a.results.length);
  const kinds = (Object.keys(MISS_LABEL) as MissKind[]).filter((k) => a.misses[k].length > 0);
  const when = r.submittedAt ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(r.submittedAt) : "";
  const stamp = `Prepared for ${pdfSafe(student.name)} (${pdfSafe(student.email)}). Personal copy: please don't share.`;
  return (
    <Document title={pdfSafe(`${r.mock.title} - analysis`)} author="The Convert Club">
      {only !== "solutions" && <Page size="A4" style={s.page}>
        <View style={s.brandRow}><View style={s.mark}><Text style={s.markT}>C</Text></View><Text style={s.brand}>The Convert Club</Text></View>
        <Text style={s.h1}>{pdfSafe(r.mock.title)}: your analysis</Text>
        <Text style={s.sub}>{pdfSafe(student.name)} · {when} · {r.mock.durationMin} minutes · {a.results.length} questions</Text>
        <View style={s.cards}>
          <View style={s.card}><Text style={s.cardL}>SCORE</Text><Text style={s.cardV}>{marks(a.score)} / {a.maxScore}</Text></View>
          <View style={s.card}><Text style={s.cardL}>ACCURACY</Text><Text style={s.cardV}>{a.accuracy}%</Text></View>
          <View style={s.card}><Text style={s.cardL}>ATTEMPTED</Text><Text style={s.cardV}>{a.attempted} / {a.results.length}</Text></View>
          <View style={s.card}><Text style={s.cardL}>TIME USED</Text><Text style={s.cardV}>{mmss(a.timeUsedSec)}</Text></View>
        </View>
        <Text style={s.note}>{a.correct} right, {a.wrong} wrong, {a.skipped} left blank. Wrong answers cost {marks(a.negativeLost)} marks.{r.cohort.percentile !== null ? ` Percentile among ${r.cohort.attempts} students: ${r.cohort.percentile}.` : ` A percentile appears once enough students have taken this mock (${r.cohort.attempts} so far).`}</Text>

        <Text style={s.h2}>Section by section</Text>
        <View style={s.table}>
          <View style={s.tr}>{["Section", "Right", "Wrong", "Blank", "Marks", "Time"].map((h, i) => <Text key={h} style={[s.th, { width: i === 0 ? "42%" : "11.6%" }]}>{h}</Text>)}</View>
          {a.bySection.map((x) => (
            <View key={x.name} style={s.tr} wrap={false}>
              <Text style={[s.td, { width: "42%" }]}>{pdfSafe(x.name)}</Text>
              <Text style={[s.td, { width: "11.6%" }]}>{x.b.correct}</Text><Text style={[s.td, { width: "11.6%" }]}>{x.b.wrong}</Text><Text style={[s.td, { width: "11.6%" }]}>{x.b.skipped}</Text>
              <Text style={[s.td, { width: "11.6%" }]}>{marks(x.b.score)}/{x.b.maxScore}</Text><Text style={[s.td, { width: "11.6%" }]}>{mmss(x.b.timeSec)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>What went wrong</Text>
        {kinds.length === 0 ? <Text>Nothing: every question was answered correctly.</Text> : kinds.map((k) => (
          <View key={k} style={s.miss} wrap={false}>
            <Text style={s.missT}>{MISS_LABEL[k].title} ({a.misses[k].length})</Text>
            <Text style={{ marginTop: 2 }}>{pdfSafe(MISS_LABEL[k].hint)}</Text>
            <Text style={[s.qMeta, { marginTop: 3 }]}>Questions: {a.misses[k].join(", ")}</Text>
          </View>
        ))}
        {a.avoidableNegative > 0 && <Text style={s.note}>About {marks(a.avoidableNegative)} marks went on answers you rushed or changed your mind about.</Text>}
        <Text style={s.note}>These labels are inferred from time spent and answer changes. They show where to look; they are not a verdict.</Text>

        <Text style={s.h2}>Skill areas: weakest first</Text>
        <View style={s.table}>
          <View style={s.tr}>{["Area", "Right", "Total", "Marks"].map((h, i) => <Text key={h} style={[s.th, { width: i === 0 ? "58%" : "14%" }]}>{h}</Text>)}</View>
          {a.byArea.map((t) => (
            <View key={t.name} style={s.tr} wrap={false}><Text style={[s.td, { width: "58%" }]}>{pdfSafe(t.name)}</Text><Text style={[s.td, { width: "14%" }]}>{t.b.correct}</Text><Text style={[s.td, { width: "14%" }]}>{t.b.total}</Text><Text style={[s.td, { width: "14%" }]}>{marks(t.b.score)}</Text></View>
          ))}
        </View>
        <Text style={s.h2}>Topics to revisit</Text>
        <Text>{pdfSafe(a.byTopic.filter((t) => t.b.correct < t.b.total).slice(0, 12).map((t) => t.name).join(", ")) || "None: every topic was fully right."}</Text>
        <Text style={s.note}>Even pace for this paper is about {Math.round(pace)} seconds a question. Your average on the questions you opened was {Math.round(a.timeUsedSec / Math.max(1, a.results.filter((x) => x.visited || x.timeSec > 0).length))} seconds.</Text>
        <View style={s.footer} fixed><Text>{stamp}</Text><Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /></View>
      </Page>}

      {only !== "summary" && <Page size="A4" style={s.page}>
        <Text style={s.h1}>Every question, with the solution</Text>
        <Text style={s.sub}>Your answer is marked, the right answer is shown, and the working follows.</Text>
        <View style={{ marginTop: 10 }}>
          {r.questions.map((q) => {
            const x = a.results.find((y) => y.id === q.id)!;
            const chip = x.outcome === "correct" ? { t: `Correct +${marks(x.marksEarned)}`, bg: C.greenTint, c: C.green } : x.outcome === "wrong" ? { t: `Wrong ${marks(x.marksEarned)}`, bg: C.tint, c: C.oxblood } : { t: "Skipped", bg: C.soft, c: C.muted };
            const ctx = q.context as { lines?: string[]; table?: string[][] | null } | null;
            return (
              <View key={q.id} style={s.q} wrap={false}>
                <View style={s.qHead}><Text style={s.qNo}>Q{q.number}</Text><Text style={s.qMeta}>{pdfSafe(q.sectionName)}{q.topic ? ` · ${pdfSafe(q.topic)}` : ""} · {mmss(x.timeSec)}</Text><Text style={[s.chip, { backgroundColor: chip.bg, color: chip.c }]}>{chip.t}</Text></View>
                {ctx?.lines?.map((l, i) => <PdfRich key={i} text={l} imgs={imgs} style={{ fontFamily: i === 0 ? "Helvetica-Bold" : "Helvetica", marginBottom: 2 }} />)}
                {ctx?.table && <View style={[s.table, { marginVertical: 4 }]}>{ctx.table.map((row, ri) => <View key={ri} style={s.tr}>{row.map((c, ci) => <Text key={ci} style={[ri === 0 ? s.th : s.td, { flexGrow: 1, flexBasis: 0 }]}>{rich(c)}</Text>)}</View>)}</View>}
                <PdfRich text={q.stem} imgs={imgs} />
                {q.options.map((o, i) => {
                  const right = i === q.correct, mine = i === x.choice;
                  return <View key={i} style={[s.opt, right ? { backgroundColor: C.greenTint } : mine ? { backgroundColor: C.tint } : {}]}><Text style={s.optL}>{LET[i]}.</Text><View style={{ flex: 1 }}><PdfRich text={o} imgs={imgs} suffix={`${right ? "   (correct answer)" : ""}${mine ? "   (your answer)" : ""}`} /></View></View>;
                })}
                {q.explanation && <View style={s.sol}><Text style={s.solL}>SOLUTION</Text><PdfRich text={q.explanation} imgs={imgs} /></View>}
              </View>
            );
          })}
        </View>
        <View style={s.footer} fixed><Text>{stamp}</Text><Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /></View>
      </Page>}
    </Document>
  );
}

export const renderMockReport = (r: ResultView, student: { name: string; email: string }, only?: "summary" | "solutions", imgs: PdfImages = new Map()) => renderToBuffer(<Report r={r} student={student} only={only} imgs={imgs} />);
