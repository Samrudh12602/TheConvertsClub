/**
 * Which legal documents each kind of user must accept, and which version is current.
 * BUMP `LEGAL_VERSION` whenever any legal text changes in a way that matters: every student and mentor
 * is then asked to accept the new version before they can continue. Keep it a date string.
 */
export const LEGAL_VERSION = "2026-10-05";

export type LegalDocKey = "terms" | "privacy" | "refunds" | "mentor-agreement";
export type AcceptingRole = "STUDENT" | "MENTOR";

export const DOC_LABEL: Record<LegalDocKey, string> = {
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  refunds: "Refund Policy",
  "mentor-agreement": "Mentor Agreement",
};

export const REQUIRED_DOCS: Record<AcceptingRole, LegalDocKey[]> = {
  STUDENT: ["terms", "privacy", "refunds"],
  MENTOR: ["mentor-agreement", "terms", "privacy"],
};

/** Admins are the operators, not a counterparty; they have no acceptance to give. */
export function requiredDocsFor(role: string): LegalDocKey[] | null {
  return role === "STUDENT" || role === "MENTOR" ? REQUIRED_DOCS[role] : null;
}

/** The documents a user still has to accept at the current version. */
export function missingDocs(role: string, accepted: { document: string; version: string }[]): LegalDocKey[] {
  const need = requiredDocsFor(role);
  if (!need) return [];
  const have = new Set(accepted.filter((a) => a.version === LEGAL_VERSION).map((a) => a.document));
  return need.filter((d) => !have.has(d));
}

/** "Terms of Use, Privacy Policy and Refund Policy" */
export function listLabels(docs: LegalDocKey[]): string {
  const l = docs.map((d) => DOC_LABEL[d]);
  return l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
}
