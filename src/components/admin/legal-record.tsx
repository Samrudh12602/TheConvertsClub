import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { DOC_LABEL, LEGAL_VERSION, missingDocs, type LegalDocKey } from "@/lib/legal";
import { StatusPill } from "@/components/portal/ui";

/** Admin-only proof of agreement: which documents, which version, when, how, and from which IP. */
export async function LegalRecord({ userId, role }: { userId: string; role: string }) {
  const rows = await db.legalAcceptance.findMany({ where: { userId }, orderBy: { acceptedAt: "desc" } });
  const outstanding = missingDocs(role, rows);
  const latest = rows.filter((r) => r.version === LEGAL_VERSION);
  return (
    <div className="text-[12.5px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill tone={outstanding.length === 0 ? "green" : "amber"}>{outstanding.length === 0 ? `Accepted v${LEGAL_VERSION}` : "Not yet accepted"}</StatusPill>
        {outstanding.length > 0 && <span className="text-ink-faint">Will be asked at next sign-in: {outstanding.map((d) => DOC_LABEL[d]).join(", ")}</span>}
      </div>
      {latest.length > 0 && (
        <p className="mt-2 text-ink-2">
          {latest.map((r) => DOC_LABEL[r.document as LegalDocKey] ?? r.document).join(", ")} · {fmtDate(latest[0].acceptedAt)} via {latest[0].source}{latest[0].ip ? ` · IP ${latest[0].ip}` : ""}
        </p>
      )}
      {rows.some((r) => r.version !== LEGAL_VERSION) && <p className="mt-1 text-ink-faint">Earlier versions on file: {[...new Set(rows.filter((r) => r.version !== LEGAL_VERSION).map((r) => r.version))].join(", ")}</p>}
    </div>
  );
}
