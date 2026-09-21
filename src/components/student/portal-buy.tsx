"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { openRazorpay } from "@/lib/razorpay-client";
import { startCheckoutAction } from "@/app/(public)/checkout/actions";

/** In-portal purchase (additional PI, single sessions) for a signed-in student: same server-priced Razorpay flow. */
export function PortalBuy({ slug, label, me, variant = "primary" }: { slug: string; label: string; me: { name: string; email: string; phone: string }; variant?: "primary" | "dark" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function buy() {
    setErr(null); setBusy(true);
    const phone = me.phone || window.prompt("Mobile number for session reminders (10 digits)") || "";
    const r = await startCheckoutAction({ slug, name: me.name, email: me.email, phone });
    if (!r.ok) { setErr(r.error); setBusy(false); return; }
    try {
      await openRazorpay({
        keyId: r.start.keyId, razorpayOrderId: r.start.razorpayOrderId, amountPaise: r.start.amountPaise, name: r.start.name, description: r.start.description, prefill: r.start.prefill,
        onDismiss: () => setBusy(false),
        onFailed: (m) => { setErr(`${m} You haven't been charged.`); setBusy(false); },
        onSuccess: async (resp) => {
          await fetch("/api/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...resp, orderId: r.start.orderId }) });
          router.push(`/student/payments?paid=${r.start.orderId}`);
          router.refresh();
        },
      });
    } catch { setErr("Couldn't open the payment window."); setBusy(false); }
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={variant} disabled={busy} onClick={buy}>{busy ? "Opening payment…" : label}</Button>
      {err && <p role="alert" className="max-w-[260px] text-xs leading-normal text-oxblood">{err}</p>}
    </div>
  );
}
