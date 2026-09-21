"use client";

import { useState } from "react";
import { Plus, GripVertical } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { testimonials, faqs, publicMentors } from "@/lib/data";

export function ContentClient() {
  const [tab, setTab] = useState("testimonials");
  const [mentorVisibility, setMentorVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(publicMentors.map((m) => [m.id, true]))
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Content</h1>
      <Tabs
        tabs={[
          { key: "testimonials", label: "Testimonials" },
          { key: "faq", label: "FAQ" },
          { key: "mentors", label: "Public mentor profiles" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "testimonials" && (
        <Card>
          <CardHeader title="Testimonials" action={<Button size="sm"><Plus size={14} /> Add testimonial</Button>} />
          <div className="space-y-2.5">
            {testimonials.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-hairline p-3.5">
                <GripVertical size={16} className="text-muted shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{t.name} · {t.institute}</p>
                  <p className="text-sm text-muted mt-1">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <button className="text-xs font-semibold text-brand shrink-0">Edit</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "faq" && (
        <Card>
          <CardHeader title="FAQ" action={<Button size="sm"><Plus size={14} /> Add question</Button>} />
          <div className="space-y-2.5">
            {faqs.map((f) => (
              <div key={f.q} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-hairline p-3.5">
                <GripVertical size={16} className="text-muted shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{f.q}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-1">{f.a}</p>
                </div>
                <button className="text-xs font-semibold text-brand shrink-0">Edit</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "mentors" && (
        <Card>
          <CardHeader title="Public mentor profiles" subtitle="Toggle visibility on the marketing site — tier is never shown publicly regardless of this setting" />
          <div className="space-y-2.5">
            {publicMentors.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{m.name}</p>
                  <p className="text-xs text-muted">{m.college}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={mentorVisibility[m.id]}
                    onChange={() => setMentorVisibility((v) => ({ ...v, [m.id]: !v[m.id] }))}
                    className="h-4 w-4 accent-[var(--gold-500)]"
                  />
                  Visible on site
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
