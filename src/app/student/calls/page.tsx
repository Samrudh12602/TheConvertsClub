"use client";

import { useState } from "react";
import { PartyPopper, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { currentStudent, type CallStage } from "@/lib/data";
import { formatDate } from "@/lib/format";

const STAGE_VARIANT: Record<CallStage, "warning" | "info" | "success" | "danger" | "neutral"> = {
  Awaiting: "neutral",
  "GD scheduled": "info",
  "PI scheduled": "info",
  Converted: "success",
  Waitlisted: "warning",
  "Not converted": "danger",
};

export default function CallsPage() {
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [optIn, setOptIn] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">My calls tracker</h1>

      <div className="space-y-4">
        {currentStudent.calls.map((call) => (
          <Card key={call.institute} className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink">
                <Building2 size={18} />
              </div>
              <div>
                <p className="font-semibold text-ink">{call.institute}</p>
                <p className="text-xs text-muted mt-0.5">
                  Interview:{" "}
                  {formatDate(call.interviewDate, { month: "short", year: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={STAGE_VARIANT[call.stage]}>{call.stage}</Badge>
              {call.stage === "Converted" && (
                <Button size="sm" variant="outline" onClick={() => setCelebrating(call.institute)}>
                  <PartyPopper size={14} /> Celebrate
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={!!celebrating}
        onClose={() => setCelebrating(null)}
        title={
          <span className="flex items-center gap-2">
            <PartyPopper className="text-accent" size={20} /> You converted {celebrating}!
          </span>
        }
        description="That's another win for the club. Want to share a short testimonial to help next season's students?"
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={celebrating ? optIn[celebrating] ?? false : false}
              onChange={(e) => celebrating && setOptIn((o) => ({ ...o, [celebrating]: e.target.checked }))}
              className="h-4 w-4 accent-[var(--gold-500)]"
            />
            Yes, I&apos;m happy to share a testimonial
          </label>
          {celebrating && optIn[celebrating] && (
            <Textarea placeholder="In a line or two, what made the difference for you?" rows={3} />
          )}
          <Button fullWidth onClick={() => setCelebrating(null)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
