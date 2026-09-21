"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { mentorApplications, type MentorApplication } from "@/lib/data";

const STAGES: MentorApplication["stage"][] = ["Applied", "Screening scheduled", "Scored", "Onboarded", "Rejected"];

export function ApplicationsClient() {
  const [apps, setApps] = useState(mentorApplications);
  const [active, setActive] = useState<MentorApplication | null>(null);

  const moveStage = (id: string, stage: MentorApplication["stage"]) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
    setActive((a) => (a && a.id === id ? { ...a, stage } : a));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Mentor applications</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const items = apps.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{stage}</p>
                <Badge variant="neutral">{items.length}</Badge>
              </div>
              <div className="space-y-2.5 min-h-[80px]">
                {items.map((app) => (
                  <Card key={app.id} as="button" padding="sm" className="w-full text-left cursor-pointer hover:border-border-strong" onClick={() => setActive(app)}>
                    <p className="font-semibold text-ink text-sm">{app.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {app.college} · {app.batch}
                    </p>
                    {app.recommendedTier && (
                      <Badge variant="gold" className="mt-2">
                        {app.recommendedTier}
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.name} subtitle={active ? `${active.college} · Batch ${active.batch}` : undefined}>
        {active && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Link2 size={15} className="text-muted" />
              <span className="text-sm text-ink">{active.linkedin}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">GDPI experience</p>
              <p className="text-sm text-ink">{active.gdpiExperience}</p>
            </div>

            {active.scorecard && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Scorecard</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(active.scorecard).map(([k, v]) => (
                    <div key={k} className="rounded-[var(--radius-md)] border border-hairline p-2.5 text-center">
                      <p className="font-display text-lg font-bold text-ink">{v}</p>
                      <p className="text-[10px] text-muted capitalize mt-0.5">{k.replace(/([A-Z])/g, " $1")}</p>
                    </div>
                  ))}
                </div>
                {active.recommendedTier && (
                  <p className="mt-3 text-sm text-ink">
                    Recommended tier: <Badge variant="gold">{active.recommendedTier}</Badge>
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Move stage</p>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Button key={s} size="sm" variant={active.stage === s ? "primary" : "outline"} onClick={() => moveStage(active.id, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
