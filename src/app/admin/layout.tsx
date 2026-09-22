import type { Metadata } from "next";
import Link from "next/link";
import { PortalFrame } from "@/components/portal/portal-frame";
import { UserChip } from "@/components/portal/user-chip";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: { default: "Admin console", template: "%s · The Convert Club" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const overdueCount = await db.session.count({ where: { status: "CONFIRMED", startsAt: { lt: new Date() }, feedback: null } });

  return (
    <PortalFrame
      role="admin"
      titleOverrides={{ "/admin": { title: `Good ${greeting()}, ${user.name?.split(" ")[0]?.replace(/\(.*\)/, "").trim() || "Samrudh"}` } }}
      topRight={
        <>
          {overdueCount > 0 && (
            <Link href="/admin/sessions?filter=overdue" className="inline-flex items-center gap-[7px] rounded-lg border border-oxblood-line bg-oxblood-tint px-2.5 py-[7px] text-[11.5px] font-semibold leading-none text-oxblood no-underline hover:no-underline">
              <span aria-hidden className="size-1.5 rounded-full bg-oxblood" />
              {overdueCount} feedback overdue
            </Link>
          )}
          <UserChip name={user.name} />
        </>
      }
    >
      {children}
    </PortalFrame>
  );
}

function greeting() {
  const h = new Date().getUTCHours() + 5.5; // rough IST
  const ist = h >= 24 ? h - 24 : h;
  return ist < 12 ? "morning" : ist < 17 ? "afternoon" : "evening";
}
