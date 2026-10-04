import { ReferralBox } from "@/components/site/referral-box";
import { getReferral } from "@/server/referral";

/**
 * Once the visitor has entered a mentor's code, says so (a lower price never looks like a mystery) and lets them remove it.
 * Before that, optionally offers the box to enter one. No code is ever applied or shown unless they typed it.
 */
export async function ReferralBanner({ next = "/packages", offerBox = false }: { next?: string; offerBox?: boolean }) {
  const ref = await getReferral();
  if (!ref) return offerBox ? <ReferralBox /> : null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-green/20 bg-green-tint px-4 py-3 text-[12.5px] leading-[1.5] text-green">
      <span>
        <strong>Your code {ref.code} (from {ref.mentorFirst}) is applied.</strong> Prices below show what you pay with it.
      </span>
      <a href={`/api/referral/clear?next=${encodeURIComponent(next)}`} className="font-semibold underline">Remove</a>
    </div>
  );
}
