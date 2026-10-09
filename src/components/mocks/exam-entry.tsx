"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startExamAction } from "@/app/exam/actions";
import { ExamClient, type ExamSection } from "@/components/mocks/exam-client";
import { PaletteShape } from "@/components/mocks/exam-parts";
import { useToast } from "@/components/ui/toast";

interface Props {
  slug: string; title: string; candidate: string; durationMin: number; marks: number; negative: number;
  summary: { name: string; count: number }[];
  /** Admin preview only: the paper is sent to the browser only when nothing is being scored. */
  previewSections?: ExamSection[];
}

/** The instructions page shown before the clock starts. Starting spends one mock credit and begins the server clock. */
export function ExamEntry({ slug, title, candidate, durationMin, marks, negative, summary, previewSections }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [agree, setAgree] = useState(false);

  if (previewing && previewSections) return <ExamClient slug={slug} attemptId={null} preview title={title} candidate={candidate} durationMin={durationMin} remainingMs={durationMin * 60_000} sections={previewSections} saved={{}} />;

  const begin = async () => {
    // Full screen has to be requested from a click, so it is asked for here, as the exam starts.
    try { await document.documentElement.requestFullscreen?.(); } catch { /* the exam still works in a window; a banner offers it again */ }
    if (previewSections) { setPreviewing(true); return; }
    setBusy(true);
    const r = await startExamAction(slug);
    if (r.ok) router.refresh(); else { setBusy(false); toast.error(r.error); }
  };
  const total = summary.reduce((n, s) => n + s.count, 0);
  const li = "mt-2 leading-[1.6]";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#222]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="h-[52px] flex-none bg-[#3a78b8]" />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-none bg-[#cfe8f5] px-5 py-3 text-[22px] font-bold text-[#5b6b79]">Instructions</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-4 text-[14.5px]">
            <p className="text-center font-bold">Please read the instructions carefully</p>
            <h2 className="mt-4 font-bold underline">General Instructions:</h2>
            <ol className="ml-8 mt-2 list-decimal">
              <li className={li}>Total duration of the examination is <b>{Math.floor(durationMin / 60)}:{String(durationMin % 60).padStart(2, "0")}:00</b> hours. There are <b>{total} questions</b> in {summary.length} sections ({summary.map((s) => `${s.name}: ${s.count}`).join(" · ")}). Each question carries <b>{marks}</b> mark and each wrong answer costs <b>{negative}</b> mark. Unanswered questions carry no penalty.</li>
              <li className={li}>The clock is set at the server. The countdown timer in the top right corner shows the time remaining. When the timer reaches zero, the examination ends by itself and your answers are submitted. You do not need to submit it yourself. There are no separate time limits for sections.</li>
              <li className={li}>The Question Palette on the right side of the screen shows the status of each question using one of these symbols:
                <ul className="mt-3 flex flex-col gap-3">
                  <li className="flex items-center gap-3"><PaletteShape state="notVisited" label="1" size={34} />You have not visited the question yet.</li>
                  <li className="flex items-center gap-3"><PaletteShape state="notAnswered" label="3" size={34} />You have not answered the question.</li>
                  <li className="flex items-center gap-3"><PaletteShape state="answered" label="5" size={34} />You have answered the question.</li>
                  <li className="flex items-center gap-3"><PaletteShape state="marked" label="7" size={34} />You have NOT answered the question, but have marked it for review.</li>
                  <li className="flex items-center gap-3"><PaletteShape state="answeredMarked" label="9" size={34} />You have answered the question, but marked it for review.</li>
                </ul>
                <p className="mt-3">The Marked for Review status simply indicates that you would like to look at that question again. <span className="text-[#d9261c]">If a question is answered and Marked for Review, your answer for that question will be considered in the evaluation.</span></p>
              </li>
              <li className={li}>You can click the arrow at the left edge of the question palette to hide it and give the question more room. Click it again to bring the palette back.</li>
            </ol>
            <h2 className="mt-5 font-bold underline">Navigating to a Question:</h2>
            <ol className="ml-8 mt-2 list-decimal" start={5}>
              <li className={li}>To answer a question, do the following:
                <ol className="ml-6 list-[lower-alpha]">
                  <li className={li}>Click on the question number in the Question Palette to go to that question directly. Note that this does NOT save your answer to the current question.</li>
                  <li className={li}>Click on <b>Save &amp; Next</b> to save your answer for the current question and then go to the next question.</li>
                  <li className={li}>Click on <b>Mark for Review &amp; Next</b> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                </ol>
              </li>
            </ol>
            <h2 className="mt-5 font-bold underline">Answering a Question:</h2>
            <ol className="ml-8 mt-2 list-decimal" start={6}>
              <li className={li}>Procedure for answering a multiple choice question:
                <ol className="ml-6 list-[lower-alpha]">
                  <li className={li}>To select your answer, click on the button of one of the options.</li>
                  <li className={li}>To deselect your chosen answer, click on the <b>Clear Response</b> button.</li>
                  <li className={li}>To change your chosen answer, click on the button of another option.</li>
                  <li className={li}>To save your answer, you MUST click on <b>Save &amp; Next</b>.</li>
                  <li className={li}>To mark the question for review, click on <b>Mark for Review &amp; Next</b>. If an answer is selected for a question that is Marked for Review, that answer will be considered in the evaluation.</li>
                </ol>
              </li>
              <li className={li}>To change your answer to a question that has already been answered, first select that question, then follow the procedure for answering it.</li>
              <li className={li}>Only questions for which answers are saved, or marked for review after answering, will be considered for evaluation.</li>
            </ol>
            <h2 className="mt-5 font-bold underline">Navigating through sections:</h2>
            <ol className="ml-8 mt-2 list-decimal" start={9}>
              <li className={li}>Sections are shown on the top bar of the screen. Click a section name to see its questions. The section you are viewing is highlighted.</li>
              <li className={li}>After you click Save &amp; Next on the last question of a section, you go to the first question of the next section.</li>
              <li className={li}>You can move between sections and questions at any time during the examination.</li>
              <li className={li}>The legend above the question palette shows the summary of the section you are viewing.</li>
            </ol>
            <h2 className="mt-5 font-bold underline">Before you begin:</h2>
            <ul className="ml-8 mt-2 list-disc">
              <li className={li}>Use a laptop or desktop in a quiet place. The exam opens in full screen. The paper cannot be paused once the clock starts, and it can be taken only once.</li>
              <li className={li}>When you submit, this tab closes and your analysis opens in the tab you came from.</li>
              <li className={li}>Staying on this tab is part of the exercise: every time you leave it is counted and shown in your analysis.</li>
              <li className={li}>The correct answers and full solutions appear in your analysis as soon as you submit.</li>
            </ul>
            <label className="mt-5 flex items-start gap-2.5 text-[14px]"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 accent-[#3a78b8]" />I have read and understood the instructions and I am ready to begin.</label>
          </div>
          <div className="flex flex-none justify-center border-t border-[#ddd] bg-white py-3">
            <button type="button" disabled={!agree || busy} onClick={begin} className="rounded bg-[#3a78b8] px-7 py-3 text-[15px] font-semibold text-white hover:bg-[#2f6aa6] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Starting…" : "I am ready to begin"}</button>
          </div>
        </div>
        <aside className="hidden w-[300px] flex-none border-l border-[#ddd] bg-gradient-to-b from-white to-[#e8e8e8] md:block">
          <p className="px-5 py-4 text-[20px] font-bold leading-[1.25] text-[#4a7bb0]">{candidate}</p>
        </aside>
      </div>
    </div>
  );
}
