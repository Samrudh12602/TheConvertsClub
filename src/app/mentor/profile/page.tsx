"use client";

import { useState } from "react";
import { Eye, LogOut } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { currentMentor } from "@/lib/data";

export default function MentorProfilePage() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Profile</h1>
        <Badge variant="gold">{currentMentor.tier} · visible only to you</Badge>
      </div>

      <Card className="flex items-center gap-4">
        <Avatar name={currentMentor.name} size={64} />
        <div>
          <p className="font-semibold text-ink text-lg">{currentMentor.name}</p>
          <p className="text-sm text-muted">
            {currentMentor.college} · Batch {currentMentor.batch}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Public profile" subtitle="What students see when browsing mentors" action={
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={14} /> Preview
          </Button>
        } />
        <div className="space-y-4">
          <Textarea label="Bio" defaultValue={currentMentor.bio} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="College" defaultValue={currentMentor.college} />
            <Input label="Batch year" defaultValue={currentMentor.batch} />
          </div>
          <Input label="LinkedIn" defaultValue={currentMentor.linkedin} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Meeting link" subtitle="Used for every session you host" />
        <Input defaultValue="meet.google.com/ish-kapr-mock" />
      </Card>

      <Card>
        <CardHeader title="Payout details" />
        <Input label="UPI ID" defaultValue="ishaan.kapoor@okhdfc" />
      </Card>

      <Button className="mt-2" size="sm">
        Save changes
      </Button>

      <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger-bg">
        <LogOut size={16} /> Log out
      </Button>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Public profile preview" description="This is exactly what students see — no tier shown.">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <Avatar name={currentMentor.name} size={52} />
            <div>
              <p className="font-semibold text-ink">{currentMentor.name}</p>
              <p className="text-xs text-muted">
                {currentMentor.college} · Batch {currentMentor.batch}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink">{currentMentor.bio}</p>
        </Card>
      </Modal>
    </div>
  );
}
