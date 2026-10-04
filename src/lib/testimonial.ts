/** "Rohan Kulkarni (demo)" + "IIM L" -> "Rohan, IIM L". First name only: the student agreed to that, not to their full name. */
export function testimonialWho(name: string | null | undefined, college?: string | null): string {
  const first = (name ?? "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "A student";
  const c = college?.trim();
  return c ? `${first}, ${c}` : first;
}

/** A rating is worth featuring only if the student wrote something real, was happy, and said yes. */
export function isFeaturable(r: { rating: number; comment: string | null; featureConsent: boolean }): boolean {
  return r.featureConsent && r.rating >= 4 && (r.comment?.trim().length ?? 0) >= 15;
}
