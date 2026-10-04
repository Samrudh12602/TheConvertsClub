import { getReferral } from "@/server/referral";

/** Tells the visitor a mentor's code is in play, so a lower price never looks like a mystery. */
export async function ReferralBanner({ next = "/packages" }: { next?: string }) {
  const ref = await getReferral();
  if (!ref) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-green/20 bg-green-tint px-4 py-3 text-[12.5px] leading-[1.5] text-green">
      <span>
        <strong>{ref.mentorFirst}&apos;s referral code <span className="tracking-[0.06em]">{ref.code}</span> is applied.</strong> Prices below show what you pay with it.
      </span>
      <a href={`/api/referral/clear?next=${encodeURIComponent(next)}`} className="font-semibold underline">Remove</a>
    </div>
  );
}
