import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted">Loading checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
