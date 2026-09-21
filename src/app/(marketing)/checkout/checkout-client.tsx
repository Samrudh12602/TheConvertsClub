"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { packages, services } from "@/lib/data";
import { formatINR } from "@/lib/format";

type Step = "details" | "paying" | "success" | "failure";

export function CheckoutClient() {
  const router = useRouter();
  const params = useSearchParams();
  const pkg = packages.find((p) => p.id === params.get("package"));
  const service = services.find((s) => s.id === params.get("service"));
  const product = pkg ?? service ?? packages[0];
  const price = product.price;
  const mrp = "mrp" in product ? product.mrp : undefined;

  const [step, setStep] = useState<Step>("details");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCoupon = () => {
    if (coupon.trim().length > 0) setCouponApplied(true);
  };

  const discount = couponApplied ? Math.round(price * 0.1) : 0;
  const total = price - discount;

  const pay = () => {
    setStep("paying");
    setTimeout(() => {
      setStep(Math.random() > 0.15 ? "success" : "failure");
    }, 1800);
  };

  if (step === "success") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">You&apos;re in.</h1>
        <p className="mt-2 text-muted">Check your email to set up your account and log in to your dashboard.</p>
        <Button className="mt-8" size="lg" onClick={() => router.push("/login" as never)}>
          Set up my account
        </Button>
      </div>
    );
  }

  if (step === "failure") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg text-danger">
          <XCircle size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">Payment failed</h1>
        <p className="mt-2 text-muted">Your card or UPI payment couldn&apos;t be processed. No amount was deducted.</p>
        <Button className="mt-8" size="lg" onClick={() => setStep("details")}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid lg:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Checkout</h1>

        <Card className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Your details</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full name" placeholder="Your name" required />
            <Input label="Email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="mt-4">
            <Input label="Phone number" placeholder="+91 XXXXX XXXXX" required />
          </div>
        </Card>

        <Card className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Coupon</p>
          <div className="flex gap-3">
            <Input
              placeholder="Enter coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1"
              disabled={couponApplied}
            />
            <Button variant="outline" onClick={applyCoupon} disabled={couponApplied || !coupon.trim()}>
              Apply
            </Button>
          </div>
          {couponApplied && (
            <p className="mt-2 text-xs font-medium text-success flex items-center gap-1.5">
              <Tag size={13} /> Coupon applied — {formatINR(discount)} off
            </p>
          )}
        </Card>

        {step === "paying" ? (
          <Card className="mt-6 flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 size={28} className="animate-spin text-brand" />
            <p className="text-sm font-medium text-ink">Redirecting to Razorpay…</p>
            <p className="text-xs text-muted max-w-xs">Do not close this window. Your payment is being processed securely.</p>
          </Card>
        ) : (
          <Button size="lg" fullWidth className="mt-6" onClick={pay}>
            <ShieldCheck size={17} /> Pay {formatINR(total)} securely
          </Button>
        )}
      </div>

      <Card className="h-fit" padding="lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Order summary</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{product.name}</p>
            {"inclusions" in product && <p className="text-xs text-muted mt-0.5">{product.inclusions.length} inclusions</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-ink tabular-nums">{formatINR(price)}</p>
            {mrp && <p className="text-xs text-muted line-through tabular-nums">{formatINR(mrp)}</p>}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-hairline space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(price)}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-success">
              <span>Coupon discount</span>
              <span className="tabular-nums">-{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-ink pt-2 border-t border-hairline">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
