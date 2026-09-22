import { Empty, Panel } from "@/components/portal/ui";
import { fmtDate } from "@/lib/format";
import { CREDIT_FULL_LABEL, CREDIT_KIND_ORDER } from "@/lib/labels";
import type { CreditSummary, EnrollmentCredits } from "@/server/credits";
import type { CreditKind } from "@/generated/prisma/client";

/**
 * Full, itemized picture of what a student has bought and what's left of it. Every credit kind is
 * shown on its own row — PI, GD, WAT, SOP (basic/detailed/revision), strategy and guidance credits
 * are never interchangeable, so they're never summed into one number or merged with each other.
 */
export function CreditBreakdown({ summary, enrollments }: { summary: Partial<Record<CreditKind, CreditSummary>>; enrollments: EnrollmentCredits[] }) {
  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const kindsWithHistory = CREDIT_KIND_ORDER.filter((k) => (summary[k]?.granted ?? 0) > 0);

  return (
    <>
      <Panel title="What you're enrolled in" flush={false}>
        {active.length === 0 ? (
          <Empty>Nothing purchased yet. Buy a package or a single session to get started.</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((e) => (
              <div key={e.enrollmentId} className="rounded-[10px] border border-line-soft p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-sm font-bold leading-[1.3] text-ink">{e.productName}</p>
                  <p className="text-[11px] leading-none text-ink-faint">Purchased {fmtDate(e.purchasedAt)}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.credits.map((c) => (
                    <span key={c.kind} className="tnum rounded-md bg-line-soft px-2.5 py-1.5 text-[11.5px] font-semibold leading-none text-ink-2">
                      {c.quantity} {CREDIT_FULL_LABEL[c.kind]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Your credits, by type" flush={false}>
        <p className="mb-3 text-[11.5px] leading-[1.5] text-ink-faint">
          Credits don&apos;t convert between types — a PI credit can only book a Mock PI, a GD credit only a GD/GE batch, and so on.
        </p>
        {kindsWithHistory.length === 0 ? (
          <Empty>No credits yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line">
                  {["Credit type", "Available", "Held", "Used", "Total granted"].map((h) => (
                    <th key={h} className="type-label px-2.5 py-2 text-ink-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kindsWithHistory.map((k) => {
                  const s = summary[k]!;
                  return (
                    <tr key={k} className="border-b border-line-soft last:border-b-0">
                      <td className="px-2.5 py-2.5 font-medium text-ink-body">{CREDIT_FULL_LABEL[k]}</td>
                      <td className="tnum px-2.5 py-2.5 font-semibold text-ink">{s.available}</td>
                      <td className="tnum px-2.5 py-2.5 text-amber">{s.reserved > 0 ? s.reserved : "—"}</td>
                      <td className="tnum px-2.5 py-2.5 text-ink-faint">{s.used > 0 ? s.used : "—"}</td>
                      <td className="tnum px-2.5 py-2.5 text-ink-faint">{s.granted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
