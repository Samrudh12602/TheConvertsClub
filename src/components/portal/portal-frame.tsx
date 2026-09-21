import { PortalSidebar } from "@/components/portal/sidebar";
import { portals, type PortalRole } from "@/lib/portal-nav";

/** Credits box, student only. `credits` come from the CreditLedger (Phase 2); empty until then. */
function CreditsBox({ credits }: { credits: string[] }) {
  return (
    <div className="mt-4 rounded-[9px] bg-ink p-3">
      <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-dark-muted">Credits left</p>
      {credits.length > 0 ? (
        <ul className="mt-[9px] flex flex-wrap gap-[5px]">
          {credits.map((c) => (
            <li key={c} className="tnum rounded-[5px] bg-dark-active px-[7px] py-[5px] text-[11px] font-semibold leading-none text-dark-text">
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-normal text-dark-muted">No credits yet.</p>
      )}
    </div>
  );
}

/** Tier box, mentor only. Tier is visible to the mentor themselves and to Admin, never to students or the public. */
function TierBox({ tier }: { tier: "SENIOR" | "JUNIOR" }) {
  return (
    <div className="mt-4 rounded-[9px] bg-ink p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-dark-muted">Your tier</span>
        <span className="rounded bg-oxblood px-1.5 py-1 text-[10px] font-bold leading-none tracking-[0.09em] text-white">{tier}</span>
      </div>
      <p className="mt-2 text-[11px] leading-normal text-dark-muted">Visible only to you and Samrudh. Students never see it.</p>
    </div>
  );
}

export function PortalFrame({
  role,
  credits,
  tier,
  children,
}: {
  role: PortalRole;
  credits?: string[];
  tier?: "SENIOR" | "JUNIOR" | null;
  children: React.ReactNode;
}) {
  const footer = role === "student" ? <CreditsBox credits={credits ?? []} /> : role === "mentor" && tier ? <TierBox tier={tier} /> : null;
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink md:flex-row">
      <PortalSidebar role={role} groups={portals[role].groups} footer={footer} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
