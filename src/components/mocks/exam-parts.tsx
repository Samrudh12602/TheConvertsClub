"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Delete, X } from "lucide-react";

export type PaletteState = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";

/** The question-palette symbols of the real exam: grey square, red shield, green shield, purple circle, purple circle with a tick. */
export function PaletteShape({ state, label, current, onClick, size = 44 }: { state: PaletteState; label: string | number; current?: boolean; onClick?: () => void; size?: number }) {
  const base = "relative flex items-center justify-center font-semibold leading-none shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition";
  const shape: Record<PaletteState, string> = {
    notVisited: "rounded-md border border-[#c9c9c9] bg-gradient-to-b from-white to-[#e9e9e9] text-[#333]",
    notAnswered: "rounded-t-[999px] rounded-b-[8px] bg-gradient-to-b from-[#f26a3d] to-[#d9461a] text-white",
    answered: "rounded-b-[999px] rounded-t-[8px] bg-gradient-to-b from-[#67c24a] to-[#3f9a2b] text-white",
    marked: "rounded-full bg-gradient-to-b from-[#8a5bc4] to-[#5f3a9e] text-white",
    answeredMarked: "rounded-full bg-gradient-to-b from-[#8a5bc4] to-[#5f3a9e] text-white",
  };
  const inner = (
    <>
      <span style={{ fontSize: size * 0.4 }}>{label}</span>
      {state === "answeredMarked" && <span aria-hidden className="absolute -bottom-0.5 -right-0.5 flex size-[38%] items-center justify-center rounded-full bg-[#3f9a2b] ring-1 ring-white"><Check className="size-[70%] text-white" strokeWidth={4} /></span>}
    </>
  );
  const cls = clsx(base, shape[state], current && "outline outline-2 outline-offset-2 outline-[#2b6cb0]");
  return onClick
    ? <button type="button" onClick={onClick} className={clsx(cls, "hover:brightness-105")} style={{ width: size, height: size }} aria-label={`Question ${label}`}>{inner}</button>
    : <span className={cls} style={{ width: size, height: size }}>{inner}</span>;
}

export const STATE_WORD: Record<PaletteState, string> = { notVisited: "Not Visited", notAnswered: "Not Answered", answered: "Answered", marked: "Marked for Review", answeredMarked: "Answered & Marked for Review" };

/** The legend with live counts. */
export function Legend({ counts }: { counts: Record<PaletteState, number> }) {
  const item = (s: PaletteState, text: string, extra?: string) => (
    <div className="flex items-center gap-2.5 text-[11.5px] leading-[1.25] text-[#333]"><PaletteShape state={s} label={counts[s]} size={32} /><span>{text}{extra && <span className="block text-[10.5px] text-[#666]">{extra}</span>}</span></div>
  );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {item("answered", "Answered")}
      {item("notAnswered", "Not Answered")}
      {item("marked", "Marked")}
      {item("notVisited", "Not Visited")}
      <div className="col-span-2">{item("answeredMarked", "Answered & Marked for Review", "(will be considered for evaluation)")}</div>
    </div>
  );
}

interface Ctx { lines?: string[]; table?: string[][] | null }

/** A shared passage or data table that several questions refer to. */
export function QContext({ context }: { context: unknown }) {
  const c = context as Ctx | null;
  if (!c || (!c.lines?.length && !c.table)) return null;
  return (
    <div className="mb-3 rounded border border-[#d5dde6] bg-[#f6f9fc] p-3 text-[14px] leading-[1.6] text-[#222]">
      {c.lines?.map((l, i) => <p key={i} className={i === 0 ? "font-semibold" : ""}>{l}</p>)}
      {c.table && (
        <div className="mt-2 overflow-x-auto">
          <table className="border-collapse text-[13px]">
            <tbody>
              {c.table.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => (ri === 0 ? <th key={ci} className="border border-[#9aa8b8] bg-[#e4ecf4] px-3 py-1.5 text-left font-semibold">{cell}</th> : <td key={ci} className="border border-[#9aa8b8] px-3 py-1.5">{cell}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** A plain on-screen calculator, like the one the real exam offers. */
export function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const apply = (a: number, b: number, o: string) => (o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : b === 0 ? NaN : a / b);
  const fmt = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1e10) / 1e10) : "Error");
  const digit = (d: string) => { setDisplay((x) => (fresh || x === "0" ? (d === "." ? "0." : d) : d === "." && x.includes(".") ? x : x + d)); setFresh(false); };
  const operate = (o: string) => { const cur = Number(display); if (acc !== null && op && !fresh) { const r = apply(acc, cur, op); setAcc(r); setDisplay(fmt(r)); } else setAcc(cur); setOp(o); setFresh(true); };
  const equals = () => { if (acc !== null && op) { const r = apply(acc, Number(display), op); setDisplay(fmt(r)); setAcc(null); setOp(null); setFresh(true); } };
  const clear = () => { setDisplay("0"); setAcc(null); setOp(null); setFresh(true); };
  const btn = "flex h-10 items-center justify-center rounded bg-[#eef1f5] text-[15px] font-semibold text-[#222] hover:bg-[#dde3ea] active:bg-[#cfd7e0]";
  return (
    <div className="fixed right-4 top-[72px] z-40 w-[232px] rounded-lg border border-[#b8c2cf] bg-white p-3 shadow-2xl" role="dialog" aria-label="Calculator">
      <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-[#444]">Calculator</span><button type="button" onClick={onClose} aria-label="Close calculator" className="rounded p-1 text-[#666] hover:bg-[#eee]"><X className="size-4" /></button></div>
      <div className="mb-2 overflow-hidden rounded border border-[#c9d1da] bg-[#f4f7fa] px-2 py-2 text-right font-mono text-[20px] text-[#111]">{display}</div>
      <div className="grid grid-cols-4 gap-1.5">
        <button className={btn} onClick={clear}>C</button>
        <button className={btn} onClick={() => setDisplay((x) => (x.length > 1 ? x.slice(0, -1) : "0"))} aria-label="Backspace"><Delete className="size-4" /></button>
        <button className={btn} onClick={() => setDisplay((x) => fmt(-Number(x)))}>±</button>
        <button className={clsx(btn, "bg-[#dbe7f5]")} onClick={() => operate("÷")}>÷</button>
        {["7", "8", "9"].map((d) => <button key={d} className={btn} onClick={() => digit(d)}>{d}</button>)}
        <button className={clsx(btn, "bg-[#dbe7f5]")} onClick={() => operate("×")}>×</button>
        {["4", "5", "6"].map((d) => <button key={d} className={btn} onClick={() => digit(d)}>{d}</button>)}
        <button className={clsx(btn, "bg-[#dbe7f5]")} onClick={() => operate("−")}>−</button>
        {["1", "2", "3"].map((d) => <button key={d} className={btn} onClick={() => digit(d)}>{d}</button>)}
        <button className={clsx(btn, "bg-[#dbe7f5]")} onClick={() => operate("+")}>+</button>
        <button className={clsx(btn, "col-span-2")} onClick={() => digit("0")}>0</button>
        <button className={btn} onClick={() => digit(".")}>.</button>
        <button className={clsx(btn, "bg-[#3a78b8] text-white hover:bg-[#2f6aa6]")} onClick={equals}>=</button>
      </div>
    </div>
  );
}
