"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";

const INTEGRATIONS = [
  { name: "Razorpay", status: "Connected" },
  { name: "Email (transactional)", status: "Connected" },
  { name: "Google Calendar", status: "Not connected" },
];

const TEAM = [
  { name: "Samrudh", role: "Owner" },
  { name: "Ishaan Kapoor", role: "Mentor mode admin" },
];

const AUDIT_LOG = [
  { actor: "Samrudh", action: "Approved payout run — ₹18,200 across 5 mentors", time: "2d ago" },
  { actor: "Samrudh", action: "Reassigned Mock PI from Rohan Bhatia to Ishaan Kapoor", time: "3d ago" },
  { actor: "Samrudh", action: "Updated Junior tier rate for Mock GD/GE to ₹125", time: "1w ago" },
];

export function SettingsClient() {
  const [tab, setTab] = useState("booking");
  const [autoConfirm, setAutoConfirm] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <Tabs
        tabs={[
          { key: "booking", label: "Booking rules" },
          { key: "team", label: "Team & roles" },
          { key: "integrations", label: "Integrations" },
          { key: "audit", label: "Audit log" },
          { key: "data", label: "Data" },
          { key: "branding", label: "Branding" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "booking" && (
        <Card className="max-w-xl">
          <CardHeader title="Booking rules" />
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Minimum notice (hours)" type="number" defaultValue={4} />
              <Input label="Cancellation window (hours)" type="number" defaultValue={4} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Reschedule limit per session" type="number" defaultValue={2} />
              <Input label="Session duration (minutes)" type="number" defaultValue={60} />
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <div>
                <p className="text-sm font-medium text-ink">Auto-confirm bookings</p>
                <p className="text-xs text-muted">Off routes new bookings to Admin approval instead.</p>
              </div>
              <button
                onClick={() => setAutoConfirm((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${autoConfirm ? "bg-accent" : "bg-sunken"}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${autoConfirm ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <Button size="sm">Save booking rules</Button>
          </div>
        </Card>
      )}

      {tab === "team" && (
        <Card className="max-w-xl">
          <CardHeader title="Team & roles" />
          <div className="space-y-2.5">
            {TEAM.map((t) => (
              <div key={t.name} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} size={36} />
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                </div>
                <Select defaultValue={t.role} className="w-48">
                  <option>Owner</option>
                  <option>Mentor mode admin</option>
                  <option>Support</option>
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "integrations" && (
        <Card className="max-w-xl">
          <CardHeader title="Integrations" />
          <div className="space-y-2.5">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
                <p className="text-sm font-medium text-ink">{i.name}</p>
                <Badge variant={i.status === "Connected" ? "success" : "neutral"}>
                  {i.status === "Connected" ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {i.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "audit" && (
        <Card>
          <CardHeader title="Audit log" />
          <div className="space-y-3">
            {AUDIT_LOG.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                <div>
                  <p className="text-ink">
                    <strong>{a.actor}</strong> {a.action}
                  </p>
                  <p className="text-xs text-muted">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "data" && (
        <Card className="max-w-xl">
          <CardHeader title="Data export & deletion requests" />
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <p className="text-sm text-ink">Sanya Kapoor requested data export</p>
              <Button size="sm" variant="outline">Fulfil</Button>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <p className="text-sm text-ink">Ex-student requested deletion</p>
              <Button size="sm" variant="danger">Process</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === "branding" && (
        <Card className="max-w-xl">
          <CardHeader title="Branding" />
          <div className="space-y-4">
            <Input label="Platform name" defaultValue="The Convert Club" />
            <Input label="Tagline" defaultValue="You got the call. Now let's convert it." />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Navy (brand)" defaultValue="#0B1430" />
              <Input label="Gold (accent)" defaultValue="#C9A24B" />
            </div>
            <Button size="sm">Save branding</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
