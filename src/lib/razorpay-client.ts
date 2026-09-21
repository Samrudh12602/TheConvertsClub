"use client";

/** Razorpay Checkout loader and opener (client only). The order id and amount come from the server. */
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: unknown) => void): void };
  }
}

let loading: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error("Couldn't load the payment window")); };
    document.body.appendChild(s);
  });
  return loading;
}

export interface OpenArgs {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onDismiss: () => void;
  onFailed: (message: string) => void;
}

export async function openRazorpay(a: OpenArgs) {
  await loadRazorpay();
  const rz = new window.Razorpay!({
    key: a.keyId, amount: a.amountPaise, currency: "INR", order_id: a.razorpayOrderId, name: a.name, description: a.description,
    prefill: a.prefill, theme: { color: "#7A1F2B" },
    handler: a.onSuccess,
    modal: { ondismiss: a.onDismiss },
  });
  rz.on("payment.failed", (r) => a.onFailed((r as { error?: { description?: string } })?.error?.description ?? "The payment failed."));
  rz.open();
}
