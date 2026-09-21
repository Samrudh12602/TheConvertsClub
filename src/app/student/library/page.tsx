"use client";

import { useState } from "react";
import { BookOpen, FileCheck2, ListChecks, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";

const CHECKLISTS = [
  { title: "PI day checklist", items: ["Print 2 extra resume copies", "Carry admit card + ID", "Review your last 3 feedback reports", "Prepare 3 questions to ask the panel"] },
  { title: "GD/GE checklist", items: ["Read the day's newspaper", "Practice a 30-second opening line", "List 3 ways to re-enter a dominated discussion"] },
];

const RESOURCES = [
  { title: "Why MBA — answer framework", type: "Guide" },
  { title: "Cross-questioning survival kit", type: "Guide" },
  { title: "Institute-fit talking points, by B-school", type: "Reference" },
  { title: "Common WAT topics, Jan–Mar 2026", type: "Reference" },
];

const BOOKLET_SECTIONS = [
  { heading: "Your profile summary", body: "B.Tech Mechanical, NIT Trichy · 2 years product analytics experience · Target: XLRI, SPJIMR, SIBM." },
  { heading: "Likely questions for you", body: "Why the shift from mechanical engineering to analytics? Walk me through a project where your recommendation was rejected. Why XLRI over SPJIMR?" },
  { heading: "Institute-specific notes — XLRI", body: "XLRI weighs HR fit heavily even for BM. Be ready to discuss ambiguity tolerance and a time you led without authority." },
];

export default function LibraryPage() {
  const [bookletOpen, setBookletOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Prep library</h1>
        <p className="text-sm text-muted mt-1">Your personalised booklet, checklists and reference material.</p>
      </div>

      <Card className="flex items-center justify-between gap-4 border-accent bg-navy-950">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
            <FileCheck2 size={20} />
          </div>
          <div>
            <p className="font-semibold text-white">Your personalised PI booklet</p>
            <p className="text-sm text-navy-100 mt-0.5">Built from your profile and every feedback report so far.</p>
          </div>
        </div>
        <button onClick={() => setBookletOpen(true)} className="shrink-0 text-gold-400 hover:text-gold-300">
          <ChevronRight size={20} />
        </button>
      </Card>

      <div>
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <ListChecks size={17} /> Checklists
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHECKLISTS.map((c) => (
            <Card key={c.title}>
              <p className="font-semibold text-ink mb-3">{c.title}</p>
              <ul className="space-y-2">
                {c.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
          <BookOpen size={17} /> Resources
        </h2>
        <div className="divide-y divide-hairline rounded-[var(--radius-lg)] border border-hairline bg-surface">
          {RESOURCES.map((r) => (
            <button key={r.title} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-sunken/60">
              <span className="text-sm font-medium text-ink">{r.title}</span>
              <Badge variant="outline">{r.type}</Badge>
            </button>
          ))}
        </div>
      </div>

      <Drawer open={bookletOpen} onClose={() => setBookletOpen(false)} title="Your PI booklet" subtitle="Personalised, updated after every session">
        <div className="space-y-6">
          {BOOKLET_SECTIONS.map((s) => (
            <div key={s.heading}>
              <p className="text-sm font-semibold text-ink mb-1.5">{s.heading}</p>
              <p className="text-sm text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
