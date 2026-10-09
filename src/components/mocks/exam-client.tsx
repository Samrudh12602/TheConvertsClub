"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Accessibility, Calculator as CalcIcon, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, Maximize2, UserRound, ZoomIn } from "lucide-react";
import { nowMs } from "@/lib/datetime";
import { addTimeAction, saveAnswerAction, submitExamAction, tabSwitchAction } from "@/app/exam/actions";
import { Calculator, Legend, PaletteShape, QContext, STATE_WORD, type PaletteState } from "@/components/mocks/exam-parts";
import { SubmitDialog } from "@/components/mocks/submit-dialog";
import { RichText } from "@/components/mocks/rich-text";
import { useToast } from "@/components/ui/toast";

export interface ExamQuestion { id: string; number: number; stem: string; context: unknown; options: string[]; marks: number; negative: number }
export interface ExamSection { id: string; name: string; questions: ExamQuestion[] }
export interface SavedState { choice: number | null; marked: boolean; visited: boolean }
interface Props { slug: string; attemptId: string | null; preview?: boolean; title: string; candidate: string; durationMin: number; remainingMs: number; sections: ExamSection[]; saved: Record<string, SavedState> }

const LETTERS = ["a", "b", "c", "d", "e"];
const clock = (s: number) => `${String(Math.floor(Math.max(0, s) / 3600)).padStart(2, "0") === "00" ? "" : String(Math.floor(s / 3600)) + ":"}${String(Math.floor((Math.max(0, s) % 3600) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** The exam screen, laid out like the real SNAP computer-based test: section tabs, question palette, Save & Next, a server-side clock. */
export function ExamClient({ attemptId, preview = false, title, candidate, remainingMs, sections, saved }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [states, setStates] = useState<Record<string, SavedState>>(saved);
  const [pos, setPos] = useState({ s: 0, q: 0 });
  const sec = sections[pos.s];
  const question = sec.questions[pos.q];
  const [draft, setDraft] = useState<number | null>(saved[sections[0].questions[0].id]?.choice ?? null);
  const [left, setLeft] = useState(Math.ceil(remainingMs / 1000));
  const deadline = useRef(nowMs() + remainingMs);
  const shownAt = useRef(nowMs());
  const [palette, setPalette] = useState(true);
  const [tools, setTools] = useState(false);
  const [access, setAccess] = useState(false);
  const [calc, setCalc] = useState(false);
  const [magnify, setMagnify] = useState(false);
  const [fontStep, setFontStep] = useState(0);
  const [contrast, setContrast] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [closing, setClosing] = useState<null | "time" | "manual">(null);
  const submitting = useRef(false);
  const allowLeave = useRef(false);
  const [fullscreen, setFullscreen] = useState(true);
  const flat = useMemo(() => sections.flatMap((s, si) => s.questions.map((q, qi) => ({ q, si, qi }))), [sections]);

  const stateOf = useCallback((id: string, visitedNow = false): PaletteState => {
    const s = states[id];
    if (!s) return visitedNow ? "notAnswered" : "notVisited";
    if (!s.visited && !visitedNow) return "notVisited";
    if (s.choice !== null && s.marked) return "answeredMarked";
    if (s.choice !== null) return "answered";
    if (s.marked) return "marked";
    return "notAnswered";
  }, [states]);

  // A question counts as visited the moment it is on screen.
  const visitedNow = question.id;
  const palStates = useMemo(() => Object.fromEntries(flat.map(({ q }) => [q.id, stateOf(q.id, q.id === visitedNow)])), [flat, stateOf, visitedNow]);
  const secCounts = (sIdx: number) => { const c: Record<PaletteState, number> = { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 }; for (const q of sections[sIdx].questions) c[palStates[q.id]]++; return c; };

  // Seconds spent on the question on screen since it appeared (or since the last time they were counted).
  const takeTime = useCallback(() => { const t = nowMs(); const d = Math.round((t - shownAt.current) / 1000); shownAt.current = t; return Math.max(0, Math.min(900, d)); }, []);
  const report = useCallback((p: Promise<{ ok: boolean; error?: string }>) => { void p.then((r) => { if (!r.ok && r.error) toast.error(r.error); }).catch(() => toast.error("Couldn't reach the server. Check your connection; your answers are saved on this page.")); }, [toast]);

  const markVisited = (id: string) => setStates((m) => (m[id]?.visited ? m : { ...m, [id]: { choice: m[id]?.choice ?? null, marked: m[id]?.marked ?? false, visited: true } }));

  const go = useCallback((s: number, q: number) => {
    // Leaving a question without saving: the answer you picked but didn't save is dropped, exactly as in the real exam.
    if (!preview && attemptId) { const d = takeTime(); if (d > 0) report(addTimeAction(attemptId, question.id, d)); } else takeTime();
    markVisited(question.id);
    const target = sections[s].questions[q];
    setPos({ s, q });
    setDraft(states[target.id]?.choice ?? null);
    markVisited(target.id);
  }, [preview, attemptId, takeTime, report, question.id, sections, states]);

  const commit = (mark: boolean) => {
    const d = takeTime();
    const choice = draft;
    setStates((m) => ({ ...m, [question.id]: { choice, marked: mark, visited: true } }));
    if (!preview && attemptId) report(saveAnswerAction(attemptId, { questionId: question.id, choice, marked: mark, timeSecDelta: d }));
    const lastOfAll = pos.s === sections.length - 1 && pos.q === sec.questions.length - 1;
    if (!lastOfAll) {
      const ns = pos.q + 1 < sec.questions.length ? { s: pos.s, q: pos.q + 1 } : { s: pos.s + 1, q: 0 };
      const target = sections[ns.s].questions[ns.q];
      setPos(ns); setDraft(states[target.id]?.choice ?? null); markVisited(target.id);
    }
  };

  const clear = () => {
    const d = takeTime();
    setDraft(null);
    setStates((m) => ({ ...m, [question.id]: { choice: null, marked: false, visited: true } }));
    if (!preview && attemptId) report(saveAnswerAction(attemptId, { questionId: question.id, choice: null, marked: false, timeSecDelta: d }));
  };

  // After the paper is in: leave full screen, close this tab and send the tab that opened it to the analysis. If this tab wasn't
  // opened from the portal (a link in an email, say), it simply moves on to the analysis itself.
  const finish = useCallback((id: string) => {
    const url = `/student/mocks/${id}`;
    allowLeave.current = true;
    try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* not in full screen */ }
    try {
      const op = window.opener as Window | null;
      if (op && !op.closed && op.location.origin === window.location.origin) {
        op.location.href = url;
        op.focus();
        window.close();
        setTimeout(() => router.replace(url), 600); // still here: the browser refused to close it
        return;
      }
    } catch { /* cross-origin opener: fall through */ }
    router.replace(url);
  }, [router]);

  const doSubmit = useCallback(async (reason: "time" | "manual") => {
    if (submitting.current) return;
    submitting.current = true;
    setClosing(reason); setConfirm(false);
    if (preview || !attemptId) { allowLeave.current = true; try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignore */ } toast.info("Preview only: nothing was saved or scored."); router.replace("/admin/mocks"); return; }
    try { const d = takeTime(); if (d > 0) await addTimeAction(attemptId, question.id, d); } catch { /* the deadline may have passed; the save is best-effort */ }
    const r = await submitExamAction(attemptId);
    if (r.ok) finish(attemptId);
    else { submitting.current = false; setClosing(null); toast.error(r.error); }
  }, [preview, attemptId, router, toast, takeTime, question.id, finish]);

  // The clock mirrors a deadline the server set. At zero the paper is submitted for you.
  const submitRef = useRef(doSubmit);
  useEffect(() => { submitRef.current = doSubmit; }, [doSubmit]);
  useEffect(() => {
    const t = setInterval(() => {
      const rem = Math.max(0, Math.ceil((deadline.current - nowMs()) / 1000));
      setLeft(rem);
      if (rem <= 0 && !preview) void submitRef.current("time");
    }, 500);
    return () => clearInterval(t);
  }, [preview]);

  // Leaving the tab is counted (and shown to the student). The paper is not locked.
  useEffect(() => {
    if (preview || !attemptId) return;
    const onHide = () => { if (document.visibilityState === "hidden") { void tabSwitchAction(attemptId); } };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [preview, attemptId]);
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block); document.addEventListener("copy", block); document.addEventListener("cut", block); document.addEventListener("dragstart", block);
    const warn = (e: BeforeUnloadEvent) => { if (!allowLeave.current) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { document.removeEventListener("contextmenu", block); document.removeEventListener("copy", block); document.removeEventListener("cut", block); document.removeEventListener("dragstart", block); window.removeEventListener("beforeunload", warn); };
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const goFullscreen = () => { void document.documentElement.requestFullscreen?.().catch(() => toast.info("Your browser didn't allow full screen. You can carry on in this window.")); };

  const urgent = left <= 300;
  const fs = 16 + fontStep * 2 + (magnify ? 4 : 0);

  return (
    <div className={clsx("fixed inset-0 z-50 flex select-none flex-col text-[#222]", contrast ? "bg-black" : "bg-white")} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* top bar */}
      <header className="flex flex-none items-center justify-between gap-3 bg-[#2f2f2f] px-4 py-2.5 text-white">
        <h1 className="min-w-0 truncate text-[15px] font-semibold text-[#e8e07a]">{title}{preview && <span className="ml-2 rounded bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">PREVIEW</span>}</h1>
        <div className="flex flex-none items-center gap-2 text-[13px]">
          <div className="relative">
            <button type="button" onClick={() => { setTools((v) => !v); setAccess(false); }} className="flex items-center gap-1.5 rounded border border-white/30 bg-white/10 px-3 py-1.5 hover:bg-white/20" aria-expanded={tools}><CalcIcon className="size-3.5" aria-hidden />Tools<ChevronDown className="size-3.5" aria-hidden /></button>
            {tools && <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded border border-[#bbb] bg-white py-1 text-[#222] shadow-xl"><button type="button" className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#eef3f9]" onClick={() => { setCalc((v) => !v); setTools(false); }}>Calculator</button></div>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setAccess((v) => !v); setTools(false); }} className="flex items-center gap-1.5 hover:text-white" aria-expanded={access}><Accessibility className="size-4 text-[#7fd47a]" aria-hidden /><span className="hidden sm:inline">Accessibility</span></button>
            {access && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded border border-[#bbb] bg-white p-3 text-[13px] text-[#222] shadow-xl">
                <p className="mb-2 font-semibold">Text size</p>
                <div className="flex gap-1.5">{[["A−", -1], ["A", 0], ["A+", 1], ["A++", 2]].map(([l, v]) => <button key={l as string} type="button" onClick={() => setFontStep(v as number)} className={clsx("flex-1 rounded border px-2 py-1.5", fontStep === v ? "border-[#3a78b8] bg-[#e4eefa]" : "border-[#ccc]")}>{l}</button>)}</div>
                <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={contrast} onChange={(e) => setContrast(e.target.checked)} />High contrast</label>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setMagnify((v) => !v)} aria-pressed={magnify} className={clsx("flex items-center gap-1.5", magnify ? "text-[#ffd86b]" : "hover:text-white")}><ZoomIn className="size-4 text-[#f5b73b]" aria-hidden /><span className="hidden sm:inline">Screen Magnifier</span></button>
        </div>
      </header>

      {!fullscreen && (
        <div className="flex flex-none items-center justify-center gap-3 bg-[#fff4d6] px-4 py-1.5 text-[12.5px] text-[#6b4a05]">
          <span>This exam runs best in full screen.</span>
          <button type="button" onClick={goFullscreen} className="inline-flex items-center gap-1.5 rounded bg-[#3a78b8] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[#2f6aa6]"><Maximize2 className="size-3.5" aria-hidden />Enter full screen</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* question area */}
        <main className={clsx("flex min-w-0 flex-1 flex-col", contrast && "bg-black text-[#ffe600]")}>
          <div className="flex flex-none items-center justify-between border-b border-[#ddd] px-4 py-1.5 text-[13px]"><span className="font-semibold text-[#444]">Section</span><span className={clsx("font-semibold", urgent ? "text-[#d9261c]" : "text-[#222]")} role="timer" aria-live="off">Time Left : {clock(left)}</span></div>
          <nav className="flex flex-none gap-0 overflow-x-auto border-b border-[#ddd] bg-white" aria-label="Sections">
            {sections.map((s, i) => (
              <div key={s.id} className="relative flex-none">
                <button type="button" onClick={() => go(i, 0)} className={clsx("flex items-center gap-2 border-r border-[#e5e5e5] px-4 py-2.5 text-[14px] font-semibold", i === pos.s ? "bg-[#3a78b8] text-white" : "bg-white text-[#2f6aa6] hover:bg-[#f0f6fc]")}>{s.name}
                  <span role="button" tabIndex={0} aria-label={`About ${s.name}`} onClick={(e) => { e.stopPropagation(); setInfo((v) => (v === s.id ? null : s.id)); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setInfo((v) => (v === s.id ? null : s.id)); } }} className={clsx("flex size-5 items-center justify-center rounded-full", i === pos.s ? "bg-white/25" : "bg-[#3a78b8] text-white")}><Info className="size-3.5" aria-hidden /></span>
                </button>
                {info === s.id && <div className="absolute left-0 top-full z-30 mt-1 w-60 rounded border border-[#bbb] bg-white p-3 text-[12.5px] leading-[1.5] text-[#222] shadow-xl">{s.name}<br />{s.questions.length} questions · {s.questions.reduce((n, q) => n + q.marks, 0)} marks<br />Negative marking: {sections[0].questions[0].negative} per wrong answer</div>}
              </div>
            ))}
          </nav>
          <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-[#eee] px-4 py-2 text-[13px]"><span className="font-bold text-[#e0562d]">Question Type: MCQ</span><span>Mark/s: <b className="text-[#2f9b3f]">{question.marks.toFixed(2)}</b> | Negative Mark/s: <b className="text-[#d9261c]">{question.negative.toFixed(2)}</b></span></div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" style={{ fontSize: fs }}>
            <h2 className="mb-3 text-[1.1em] font-bold">Question No. {question.number}.</h2>
            <QContext context={question.context} />
            <p className="whitespace-pre-wrap leading-[1.6]"><RichText text={question.stem} /></p>
            <fieldset className="mt-5">
              <legend className="sr-only">Choose one option</legend>
              <div className="flex flex-col gap-3.5">
                {question.options.map((o, i) => (
                  <label key={i} className="flex cursor-pointer items-start gap-3 leading-[1.5]">
                    <input type="radio" name={`q-${question.id}`} checked={draft === i} onChange={() => setDraft(i)} className="mt-[5px] size-4 accent-[#3a78b8]" />
                    <span className="whitespace-pre-wrap"><span className="sr-only">Option {LETTERS[i]}: </span><RichText text={o} /></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <footer className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-[#ddd] bg-white px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => commit(true)} className="rounded border border-[#bbb] bg-[#f4f4f4] px-4 py-2.5 text-[14px] text-[#222] hover:bg-[#e8e8e8]">Mark for review and Next</button>
              <button type="button" onClick={clear} className="rounded border border-[#bbb] bg-[#f4f4f4] px-4 py-2.5 text-[14px] text-[#222] hover:bg-[#e8e8e8]">Clear Response</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => commit(false)} className="rounded bg-[#3a78b8] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2f6aa6]">Save &amp; Next</button>
              <button type="button" onClick={() => setConfirm(true)} className="rounded bg-[#3a78b8] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2f6aa6]">Submit Exam</button>
            </div>
          </footer>
        </main>

        {/* palette */}
        <aside className={clsx("relative flex-none border-l-2 border-[#1f1f1f] bg-white transition-[width]", palette ? "w-[320px] max-w-[46vw]" : "w-0 border-l-0")}>
          <button type="button" onClick={() => setPalette((v) => !v)} aria-label={palette ? "Hide question palette" : "Show question palette"} className="absolute -left-5 top-1/2 z-10 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-l bg-[#222] text-white">{palette ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
          {palette && (
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="flex items-center gap-3 border-b border-[#e3e3e3] px-3 py-3"><span className="flex size-12 flex-none items-center justify-center rounded bg-[#e4ecf4] text-[#4a6a8a]"><UserRound className="size-7" aria-hidden /></span><span className="min-w-0 break-words text-[15px] font-bold leading-[1.25] text-[#2f6aa6]">{candidate}</span></div>
              <div className="border-b border-[#e3e3e3] px-3 py-3"><Legend counts={secCounts(pos.s)} /></div>
              <div className="bg-[#3a78b8] px-3 py-2 text-[14px] font-semibold text-white">{sec.name}</div>
              <div className="flex-1 bg-[#dcecf8] px-3 pb-4 pt-2">
                <p className="mb-2 text-[13px] font-semibold text-[#333]">Choose a question</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {sec.questions.map((q, i) => <PaletteShape key={q.id} state={palStates[q.id]} label={q.number} current={i === pos.q} onClick={() => go(pos.s, i)} />)}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {calc && <Calculator onClose={() => setCalc(false)} />}
      <SubmitDialog open={confirm} onClose={() => setConfirm(false)} busy={closing !== null} onSubmit={() => void doSubmit("manual")} timeLeft={clock(left)} secondsLeft={left}
        sections={sections.map((s, i) => { const c = secCounts(i); return { name: s.name, total: s.questions.length, answered: c.answered + c.answeredMarked, marked: c.marked, notAnswered: c.notAnswered, notVisited: c.notVisited }; })} />
      {closing !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16222f]/85 text-white backdrop-blur-sm" role="status">
          <div className="text-center"><Loader2 className="mx-auto size-9 animate-spin text-[#8fc1ee]" aria-hidden /><p className="mt-4 text-xl font-bold">{closing === "time" ? "Time's up" : "Submitting your paper"}</p><p className="mt-1.5 text-sm text-white/75">{preview ? "Closing the preview…" : "Scoring it and opening your analysis…"}</p></div>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{STATE_WORD[palStates[question.id]]}</span>
    </div>
  );
}
