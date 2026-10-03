"use server";

import { redirect } from "next/navigation";
import { LEGAL_VERSION, requiredDocsFor } from "@/lib/legal";
import { roleHome } from "@/lib/roles";
import { audit } from "@/server/audit";
import { recordAcceptance, requestMeta } from "@/server/legal-acceptance";
import { currentUser } from "@/server/session";

export interface AcceptState { error?: string }

/** The one-click clickwrap: a signed-in student or mentor ticks the box and we record it per document. */
export async function acceptTermsAction(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const user = await currentUser();
  if (!user) redirect("/login?next=/accept-terms");
  const docs = requiredDocsFor(user.role);
  if (!docs) redirect(roleHome(user.role));
  if (formData.get("agree") !== "on") return { error: "Please tick the box to confirm you've read and agree." };
  if (user.role === "MENTOR" && formData.get("mentorTruth") !== "on") return { error: "Please confirm the details you gave us are true." };
  const meta = await requestMeta();
  await recordAcceptance({ userId: user.id, docs, source: "gate", ...meta });
  await audit({ actorId: user.id, action: "legal.accept", entity: "User", entityId: user.id, after: { version: LEGAL_VERSION, docs }, ip: meta.ip });
  redirect(roleHome(user.role));
}
