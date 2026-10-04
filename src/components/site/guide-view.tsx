"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { GuideForm } from "@/components/site/guide-form";
import { GUIDE_STEPS, GUIDE_TITLE } from "@/lib/free-guide";

export function GuideView() {
  const [done, setDone] = useState(false);
  return done ? (
    <div className="flex flex-col gap-3">
      <p role="status" className="rounded-[10px] border border-green/20 bg-green-tint px-4 py-3 text-[13px] text-green">Sent. Check your inbox (and spam). Here it is now too:</p>
      <Card className="p-[22px]">
        <h2 className="font-display text-lg font-bold text-ink">{GUIDE_TITLE}</h2>
        <ol className="mt-4 flex flex-col gap-3.5">
          {GUIDE_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="tnum w-6 flex-none text-ink-faint">{i + 1}.</span>
              <div><p className="type-label text-oxblood">{s.when}</p><p className="mt-1 text-[13.5px] leading-[1.65] text-ink-2">{s.do}</p></div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  ) : (
    <Card className="rounded-[14px] p-6"><GuideForm onDone={() => setDone(true)} /></Card>
  );
}
