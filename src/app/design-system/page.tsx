"use client";

import { Search, Bell, Star } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip, type SessionStatus } from "@/components/ui/status-chip";
import { Input } from "@/components/ui/input";
import { SlotChip, type SlotState } from "@/components/ui/slot-chip";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar, Stepper } from "@/components/ui/stepper";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/states";

const COLOR_GROUPS = [
  { name: "Navy", tokens: [["950", "#070D1F"], ["900", "#0B1430"], ["800", "#12204A"], ["700", "#1B2E66"], ["100", "#E3E8F5"]] },
  { name: "Gold", tokens: [["600", "#A8832F"], ["500", "#C9A24B"], ["400", "#D9B968"], ["300", "#E8D29A"]] },
  { name: "Ivory", tokens: [["50", "#FAF7F0"], ["100", "#F3EEE2"]] },
  { name: "Semantic", tokens: [["Success", "#1F9D6B"], ["Warning", "#D99A0B"], ["Danger", "#D14343"], ["Info", "#3B6FD8"], ["Violet", "#7A5AF8"]] },
];

const STATUSES: SessionStatus[] = ["requested", "confirmed", "in-progress", "completed", "feedback-pending", "cancelled", "no-show", "rescheduled"];
const SLOT_STATES: SlotState[] = ["open", "selected", "booked", "held", "blocked"];

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-10 border-b border-hairline scroll-mt-20">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-2xl">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-canvas/90 backdrop-blur px-4 sm:px-8 h-16">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-10">
        <Badge variant="gold">Developer handoff</Badge>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mt-4">Design system</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Tokens, type, spacing and every component with its states — implemented one-to-one as React + Tailwind, ready to build from.
        </p>

        <Section id="color" title="Color tokens" subtitle="Navy and gold are the brand identity; ivory is the portal surface. Semantic colors are used sparingly and consistently.">
          <div className="space-y-8">
            {COLOR_GROUPS.map((group) => (
              <div key={group.name}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">{group.name}</p>
                <div className="flex flex-wrap gap-4">
                  {group.tokens.map(([label, hex]) => (
                    <div key={label} className="w-28">
                      <div className="h-16 rounded-[var(--radius-md)] border border-hairline" style={{ backgroundColor: hex }} />
                      <p className="text-xs font-semibold text-ink mt-1.5">{label}</p>
                      <p className="text-[11px] text-muted">{hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="status" title="Status chips" subtitle="Used consistently for every session, everywhere in the product.">
          <div className="flex flex-wrap gap-2.5">
            {STATUSES.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography" subtitle="Fraunces for display headlines, Plus Jakarta Sans for UI. Tabular numerals everywhere numbers appear.">
          <div className="space-y-4">
            <p className="font-display text-5xl font-semibold text-ink">Aa — Display / 48</p>
            <p className="font-display text-3xl font-semibold text-ink">Aa — Display / 30</p>
            <p className="font-display text-xl font-semibold text-ink">Aa — Display / 20</p>
            <p className="text-base text-ink">Aa — Body / 16 — The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-ink">Aa — Body small / 14 — The quick brown fox jumps over the lazy dog.</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aa — Label / 12 uppercase</p>
            <p className="tabular-nums text-lg font-bold text-ink">₹2,199 · 04:32 PM · 128 sessions</p>
          </div>
        </Section>

        <Section id="spacing" title="Spacing & radii" subtitle="4px base spacing scale. 8–20px radii depending on component size.">
          <div className="flex flex-wrap gap-6">
            {[4, 8, 12, 16, 24, 32, 48].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <div className="bg-accent" style={{ width: s, height: s }} />
                <span className="text-xs text-muted">{s}px</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 mt-6">
            {[["sm", 8], ["md", 12], ["lg", 16], ["xl", 20], ["full", 999]].map(([label, r]) => (
              <div key={label as string} className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 bg-sunken border border-border-strong" style={{ borderRadius: r }} />
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="elevation" title="Elevation" subtitle="Soft, restrained shadows. Hairline borders do most of the separation work.">
          <div className="flex flex-wrap gap-6">
            {["sm", "md", "lg"].map((level) => (
              <div key={level} className="h-20 w-40 rounded-[var(--radius-lg)] bg-surface flex items-center justify-center text-xs text-muted" style={{ boxShadow: `var(--shadow-token-${level})` }}>
                shadow-{level}
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" title="Buttons" subtitle="Primary (gold) for the single main action. Secondary (navy) for the next most important. Outline and ghost for tertiary actions.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        <Section id="inputs" title="Form fields" subtitle="Default, focus, error and disabled states.">
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <Input label="Default" placeholder="Enter text" />
            <Input label="Error" placeholder="Enter text" error="This field is required" />
            <Input label="Disabled" placeholder="Enter text" disabled />
            <Input label="With hint" placeholder="Enter text" hint="This is a helper message" />
          </div>
        </Section>

        <Section id="slots" title="Slot chips" subtitle="Booking and availability building block. States: open, selected, booked, held, blocked.">
          <div className="flex flex-wrap gap-2.5">
            {SLOT_STATES.map((s) => (
              <SlotChip key={s} label="5:00 PM" state={s} />
            ))}
          </div>
        </Section>

        <Section id="badges" title="Badges" subtitle="Compact labels for metadata — never for session status (use status chips instead).">
          <div className="flex flex-wrap gap-2.5">
            <Badge variant="gold">Gold</Badge>
            <Badge variant="navy">Navy</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="violet">Violet</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        <Section id="progress" title="Progress & stepper" subtitle="Rings for credits and readiness, bars for linear progress, steppers for multi-step flows.">
          <div className="flex flex-wrap items-center gap-8">
            <ProgressRing value={3} max={4} label="3/4" sublabel="Mock PI" />
            <div className="w-64">
              <ProgressBar value={62} />
            </div>
            <div className="w-full max-w-sm">
              <Stepper steps={["Type", "Date", "Slot", "Confirm"]} current={1} />
            </div>
          </div>
        </Section>

        <Section id="tabs" title="Tabs">
          <Tabs tabs={[{ key: "a", label: "Upcoming" }, { key: "b", label: "Past" }, { key: "c", label: "Cancelled", count: 2 }]} active="a" onChange={() => {}} />
        </Section>

        <Section id="avatars" title="Avatars" subtitle="Photo when available, otherwise initials on a deterministic color.">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Aarav Mehta" size={32} />
            <Avatar name="Meera Nair" size={48} />
            <Avatar name="Ishaan Kapoor" size={64} shape="square" />
          </div>
        </Section>

        <Section id="cards" title="Cards & stat tiles">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Card title" subtitle="Supporting subtitle" />
              <p className="text-sm text-muted">Standard content card with hairline border and soft shadow.</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-muted">Stat tile</p>
              <p className="font-display text-2xl font-bold text-ink mt-1">38</p>
            </Card>
            <Card className="flex items-center gap-2">
              <Star size={16} className="fill-accent text-accent" />
              <span className="font-display text-xl font-bold text-ink">4.8</span>
            </Card>
          </div>
        </Section>

        <Section id="empty" title="Empty, loading, error states">
          <EmptyState icon={Search} title="No results" description="Try adjusting your filters." />
        </Section>

        <Section id="icons" title="Iconography" subtitle="Lucide, one consistent line weight. No emojis anywhere in the interface.">
          <div className="flex flex-wrap gap-5 text-ink">
            {[Search, Bell, Star].map((Icon, i) => (
              <Icon key={i} size={22} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
