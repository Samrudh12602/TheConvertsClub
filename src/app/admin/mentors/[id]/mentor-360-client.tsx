"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, PauseCircle, Eye, Star, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { mentors, payRates, currentMentor } from "@/lib/data";
import { formatINR } from "@/lib/format";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = 6;

export function Mentor360Client() {
  const params = useParams<{ id: string }>();
  const mentor = mentors.find((m) => m.id === params.id) ?? mentors[0];
  const [tier, setTier] = useState(mentor.tier);
  const rates = payRates[tier];

  const heat = Array.from({ length: DAYS.length * HOURS }, (_, i) => (i * 37) % 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={mentor.name} size={56} />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">{mentor.name}</h1>
            <p className="text-sm text-muted">
              {mentor.college} · Batch {mentor.batch}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <MessageSquare size={14} /> Message
          </Button>
          <Button size="sm" variant="outline">
            <PauseCircle size={14} /> {mentor.status === "paused" ? "Reactivate" : "Pause"}
          </Button>
          <Link
            href={`/mentor/dashboard?admin_view=mentor&name=${encodeURIComponent(mentor.name)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-border-strong px-3.5 text-sm font-semibold text-ink hover:bg-sunken"
          >
            <Eye size={14} /> View as mentor
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Tier" />
          <div className="flex gap-2">
            {(["Junior", "Senior"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`flex-1 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm font-semibold ${
                  tier === t ? "border-accent bg-accent text-on-gold" : "border-border-strong text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">Only visible to this mentor and Admin.</p>
        </Card>
        <Card>
          <CardHeader title="Rating" />
          <div className="flex items-center gap-2">
            <Star size={22} className="fill-accent text-accent" />
            <span className="font-display text-2xl font-bold text-ink tabular-nums">{mentor.rating}</span>
          </div>
          <p className="text-xs text-muted mt-1">from {mentor.mocksThisSeason} sessions</p>
        </Card>
        <Card>
          <CardHeader title="Earnings" />
          <p className="font-display text-2xl font-bold text-ink tabular-nums">{formatINR(mentor.earningsAccrued)}</p>
          <p className="text-xs text-muted mt-1">accrued · {formatINR(mentor.earningsPaid)} paid lifetime</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Rate overrides" subtitle={`${tier} tier card — editable per mentor`} />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(rates).map(([service, rate]) => (
            <Input key={service} label={service} defaultValue={rate === null ? "" : String(rate)} placeholder={rate === null ? "Not offered" : undefined} />
          ))}
        </div>
        <Button size="sm" className="mt-4">
          Save overrides
        </Button>
      </Card>

      <Card>
        <CardHeader title="Availability heatmap" subtitle="Hours opened by day, last 4 weeks" />
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, di) => (
            <div key={d} className="space-y-1.5">
              <p className="text-center text-xs font-semibold text-muted">{d}</p>
              {Array.from({ length: HOURS }).map((_, hi) => {
                const v = heat[di * HOURS + hi];
                return (
                  <div
                    key={hi}
                    className="h-5 rounded-[4px]"
                    style={{ backgroundColor: `color-mix(in srgb, var(--gold-500) ${v}%, var(--bg-sunken))` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Onboarding checklist" />
        <div className="space-y-2">
          {["Profile completed", "Mentor agreement accepted", "Screening mock completed", "First session delivered"].map((step, i) => (
            <div key={step} className="flex items-center gap-2.5 text-sm">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${i < 3 ? "bg-success-bg text-success" : "bg-sunken text-muted"}`}>
                {i < 3 && <Check size={12} />}
              </span>
              <span className={i < 3 ? "text-ink" : "text-muted"}>{step}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Screening scorecard" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {["Communication", "Question quality", "Cross-questioning", "Feedback quality", "Professionalism", "Weakness spotting"].map((c) => (
            <div key={c} className="rounded-[var(--radius-md)] border border-hairline p-3 text-center">
              <p className="font-display text-lg font-bold text-ink">{mentor.id === currentMentor.id ? 5 : 4}</p>
              <p className="text-xs text-muted mt-0.5">{c}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
