"use client";

import { useState } from "react";
import { Send, Eye } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";

const TEMPLATES = [
  "Booking confirmed",
  "Booking request received",
  "Session reminder (24h)",
  "Session reminder (1h)",
  "Reschedule / cancellation",
  "New session assigned",
  "Feedback published",
  "Payout processed",
  "Welcome & account setup",
];

const SENT_LOG = [
  { subject: "January cohort kickoff", audience: "All students", sent: "5 Jan", delivered: "312 / 318" },
  { subject: "New GD/GE batches open", audience: "Call Convert Plus", sent: "12 Jan", delivered: "84 / 84" },
  { subject: "Season mid-point check-in", audience: "Senior mentors", sent: "1 Feb", delivered: "3 / 3" },
];

export function CommunicationsClient() {
  const [tab, setTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [bannerText, setBannerText] = useState("Early-bird pricing ends 15 Oct — lock in Call Convert now.");
  const [bannerOn, setBannerOn] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Communications</h1>
      <Tabs
        tabs={[
          { key: "templates", label: "Email templates" },
          { key: "broadcast", label: "Broadcast" },
          { key: "log", label: "Sent log" },
          { key: "banner", label: "Site banner" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "templates" && (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5">
          <Card padding="sm">
            <div className="space-y-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left rounded-[var(--radius-sm)] px-3 py-2.5 text-sm ${
                    selectedTemplate === t ? "bg-brand text-inverse font-semibold" : "text-ink hover:bg-sunken"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title={selectedTemplate} action={<Button size="sm" variant="outline"><Eye size={14} /> Preview</Button>} />
            <div className="space-y-4">
              <Input label="Subject line" defaultValue={`Your ${selectedTemplate.toLowerCase()} — The Convert Club`} />
              <Textarea label="Body" rows={8} defaultValue={`Hi {{first_name}},\n\nThis is your ${selectedTemplate.toLowerCase()} notification.\n\nAll times are in IST.\n\n— The Convert Club`} />
              <div className="rounded-[var(--radius-md)] border border-hairline bg-navy-950 p-5">
                <p className="text-xs text-gold-400 font-semibold">EMAIL PREVIEW</p>
                <p className="text-white font-display text-lg mt-2">{selectedTemplate}</p>
                <p className="text-navy-100 text-sm mt-2">Hi Aarav, this is your {selectedTemplate.toLowerCase()} notification. All times are in IST.</p>
              </div>
              <Button size="sm">Save template</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "broadcast" && (
        <Card className="max-w-xl">
          <CardHeader title="Compose broadcast" />
          <div className="space-y-4">
            <Select label="Audience">
              <option>All students</option>
              <option>Call Convert</option>
              <option>Call Convert Plus</option>
              <option>All mentors</option>
              <option>Senior mentors</option>
              <option>Junior mentors</option>
            </Select>
            <Input label="Subject" placeholder="What's this about?" />
            <Textarea label="Message" rows={6} placeholder="Write your broadcast…" />
            <Button>
              <Send size={15} /> Send broadcast
            </Button>
          </div>
        </Card>
      )}

      {tab === "log" && (
        <Card padding="none">
          <div className="divide-y divide-hairline">
            {SENT_LOG.map((s) => (
              <div key={s.subject} className="flex items-center justify-between p-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{s.subject}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {s.audience} · sent {s.sent}
                  </p>
                </div>
                <Badge variant="success">{s.delivered} delivered</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "banner" && (
        <Card className="max-w-xl">
          <CardHeader title="In-app announcement banner" />
          <div className="space-y-4">
            <Textarea label="Banner text" value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" checked={bannerOn} onChange={(e) => setBannerOn(e.target.checked)} className="h-4 w-4 accent-[var(--gold-500)]" />
              Show banner across the site
            </label>
            {bannerOn && (
              <div className="rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-on-gold text-center">{bannerText}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
