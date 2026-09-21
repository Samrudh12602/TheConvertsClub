"use client";

import { useState } from "react";
import { ClipboardCheck, Clock3, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";

interface Item {
  id: string;
  student: string;
  type: "WAT" | "SOP";
  due: string;
  content: string;
}

const QUEUE: Item[] = [
  { id: "r1", student: "Ananya Iyer", type: "WAT", due: "Today, 8 PM", content: "Should India's gig economy workers get the same benefits as full-time employees? Gig work has grown sharply post-pandemic..." },
  { id: "r2", student: "Sanya Kapoor", type: "SOP", due: "Tomorrow, 6 PM", content: "Statement of Purpose — Sanya Kapoor. Growing up in a family of entrepreneurs, I always..." },
];

export default function MentorReviewsPage() {
  const [items, setItems] = useState(QUEUE);
  const [active, setActive] = useState<Item | null>(null);
  const [comment, setComment] = useState("");

  const submit = () => {
    if (active) setItems((prev) => prev.filter((i) => i.id !== active.id));
    setActive(null);
    setComment("");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Reviews queue</h1>

      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Queue clear" description="No WAT or SOP reviews waiting on you." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} as="button" className="text-left cursor-pointer hover:border-border-strong" onClick={() => setActive(item)}>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={item.type === "WAT" ? "info" : "violet"}>{item.type}</Badge>
                  <p className="font-medium text-ink mt-2">{item.student}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-warning shrink-0">
                  <Clock3 size={13} /> {item.due}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title={active ? `${active.type} · ${active.student}` : undefined}>
        {active && (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 flex items-center gap-1.5">
                <ClipboardCheck size={13} /> Submission
              </p>
              <p className="text-sm text-ink whitespace-pre-wrap">{active.content}</p>
            </div>
            <Textarea label="Your evaluation" placeholder="Line-by-line feedback, structure suggestions, and an overall verdict." rows={6} value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button fullWidth onClick={submit} disabled={!comment.trim()}>
              Submit evaluation
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
