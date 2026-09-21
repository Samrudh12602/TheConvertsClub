"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { faqs } from "@/lib/data";

export default function StudentHelpPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Help</h1>

      <Card className="flex items-center justify-between gap-4 flex-wrap bg-success-bg border-success/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white">
            <MessageCircle size={19} />
          </div>
          <div>
            <p className="font-semibold text-ink">Chat with us on WhatsApp</p>
            <p className="text-sm text-ink/70">10 AM – 9 PM IST, all days · reasonable-use support</p>
          </div>
        </div>
        <Button>Open WhatsApp</Button>
      </Card>

      <Card>
        <CardHeader title="Frequently asked" />
        <FaqAccordion items={faqs.slice(0, 4)} />
      </Card>

      <Card>
        <CardHeader title="Raise a query" subtitle="We typically respond within a few hours." />
        {sent ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-success/25 bg-success-bg p-4">
            <CheckCircle2 size={18} className="text-success" />
            <p className="text-sm text-ink">Your query has been sent. Check your email for updates.</p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <Select label="Topic" defaultValue="">
              <option value="" disabled>
                Select a topic
              </option>
              <option>Booking or rescheduling</option>
              <option>Payment or invoice</option>
              <option>Feedback or mentor</option>
              <option>Something else</option>
            </Select>
            <Input label="Subject" placeholder="Brief summary" required />
            <Textarea label="Details" placeholder="Tell us what's going on" required />
            <Button type="submit">Send query</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
