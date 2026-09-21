"use client";

import { useState } from "react";
import { FileText, LogOut } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currentStudent } from "@/lib/data";

const NOTIF_PREFS = [
  { key: "session", label: "Session confirmations & reminders", checked: true },
  { key: "feedback", label: "Feedback published", checked: true },
  { key: "payments", label: "Payments & invoices", checked: true },
  { key: "marketing", label: "Tips and product updates", checked: false },
];

export default function StudentProfilePage() {
  const [prefs, setPrefs] = useState(NOTIF_PREFS);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Profile & settings</h1>

      <Card className="flex items-center gap-4">
        <Avatar name={currentStudent.name} size={64} />
        <div>
          <p className="font-semibold text-ink text-lg">{currentStudent.name}</p>
          <p className="text-sm text-muted">{currentStudent.email}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Personal info" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" defaultValue={currentStudent.name} />
          <Input label="Phone" defaultValue={currentStudent.phone} />
          <Input label="College" defaultValue={currentStudent.college} />
          <Input label="Degree" defaultValue={currentStudent.degree} />
        </div>
        <Button className="mt-4" size="sm">
          Save changes
        </Button>
      </Card>

      <Card>
        <CardHeader title="Documents" />
        <div className="space-y-2.5">
          {["Resume.pdf", "SOP_Draft.pdf"].map((doc) => (
            <div key={doc} className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3.5">
              <span className="flex items-center gap-2.5 text-sm text-ink">
                <FileText size={16} className="text-brand" /> {doc}
              </span>
              <button className="text-xs font-semibold text-brand">Replace</button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Notification preferences" />
        <div className="space-y-3">
          {prefs.map((p) => (
            <label key={p.key} className="flex items-center justify-between text-sm text-ink">
              {p.label}
              <input
                type="checkbox"
                checked={p.checked}
                onChange={() =>
                  setPrefs((prev) => prev.map((item) => (item.key === p.key ? { ...item, checked: !item.checked } : item)))
                }
                className="h-4 w-4 accent-[var(--gold-500)]"
              />
            </label>
          ))}
        </div>
      </Card>

      <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger-bg">
        <LogOut size={16} /> Log out
      </Button>
    </div>
  );
}
