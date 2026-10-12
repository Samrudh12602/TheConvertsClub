/**
 * One-to-one calls: the 30-minute guidance call and the 45-minute detailed strategy call. They are on sale all the time, even while
 * interview prep (GD/PI) is "coming soon". There is no booking: the buyer gives a phone number at checkout and the
 * owner phones them. Buying one never opens the interview-prep part of the student portal.
 */
export const GUIDANCE_SLUGS = ["guidance-call", "strategy-call"] as const;
/** Credit kinds those products grant (and session types they are booked as). */
export const GUIDANCE_KINDS = ["TRIAL_GUIDANCE", "STRATEGY_DIRECT"] as const;

export const isGuidanceSlug = (slug: string) => (GUIDANCE_SLUGS as readonly string[]).includes(slug);
