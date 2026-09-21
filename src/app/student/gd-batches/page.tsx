"use client";

import { useState } from "react";
import { Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISTChip } from "@/components/ui/date-strip";
import { EmptyState } from "@/components/ui/states";

interface Batch {
  id: string;
  format: string;
  topic: string;
  date: string;
  time: string;
  capacity: number;
  filled: number;
  mentorName: string;
}

const BATCHES: Batch[] = [
  { id: "b1", format: "Current affairs", topic: "Should India cap UPI transaction fees?", date: "24 Sep", time: "6:00 PM – 7:00 PM", capacity: 8, filled: 5, mentorName: "Meera Nair" },
  { id: "b2", format: "Abstract", topic: "\"A closed door is not a locked door\"", date: "26 Sep", time: "5:00 PM – 6:00 PM", capacity: 8, filled: 8, mentorName: "Kabir Malhotra" },
  { id: "b3", format: "Business", topic: "Should ONDC be made mandatory for large retailers?", date: "28 Sep", time: "7:00 PM – 8:00 PM", capacity: 6, filled: 3, mentorName: "Rohan Bhatia" },
  { id: "b4", format: "Case / GE", topic: "Prioritise features for a fintech MVP with a 2-week runway", date: "1 Oct", time: "6:00 PM – 7:00 PM", capacity: 6, filled: 1, mentorName: "Ishaan Kapoor" },
];

export default function GdBatchesPage() {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [waitlisted, setWaitlisted] = useState<Set<string>>(new Set());

  const toggleJoin = (batch: Batch) => {
    const full = batch.filled >= batch.capacity;
    if (joined.has(batch.id)) {
      setJoined((s) => {
        const n = new Set(s);
        n.delete(batch.id);
        return n;
      });
      return;
    }
    if (waitlisted.has(batch.id)) {
      setWaitlisted((s) => {
        const n = new Set(s);
        n.delete(batch.id);
        return n;
      });
      return;
    }
    if (full) {
      setWaitlisted((s) => new Set(s).add(batch.id));
    } else {
      setJoined((s) => new Set(s).add(batch.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">GD/GE batches</h1>
          <p className="text-sm text-muted mt-1">Group sessions across current affairs, abstract, business and case/GE formats.</p>
        </div>
        <ISTChip className="hidden sm:inline-flex" />
      </div>

      {BATCHES.length === 0 ? (
        <EmptyState icon={Users2} title="No batches scheduled" description="New GD/GE batches open every week during the season." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {BATCHES.map((batch) => {
            const full = batch.filled >= batch.capacity;
            const isJoined = joined.has(batch.id);
            const isWaitlisted = waitlisted.has(batch.id);
            return (
              <Card key={batch.id}>
                <div className="flex items-center justify-between">
                  <Badge variant="violet">{batch.format}</Badge>
                  <span className="text-xs font-semibold text-muted tabular-nums">
                    {batch.capacity - batch.filled} of {batch.capacity} seats left
                  </span>
                </div>
                <p className="mt-3 font-medium text-ink text-sm leading-snug">{batch.topic}</p>
                <p className="mt-2 text-xs text-muted">
                  {batch.date} · {batch.time} IST · with {batch.mentorName}
                </p>
                <Button
                  fullWidth
                  className="mt-4"
                  variant={isJoined ? "outline" : full && !isWaitlisted ? "secondary" : "primary"}
                  onClick={() => toggleJoin(batch)}
                >
                  {isJoined ? "Leave batch" : isWaitlisted ? "Leave waitlist" : full ? "Join waitlist" : "Join batch"}
                </Button>
                {isWaitlisted && <p className="mt-2 text-xs text-warning font-medium text-center">You&apos;re #1 on the waitlist</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
