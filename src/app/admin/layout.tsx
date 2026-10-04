import type { Metadata } from "next";
import Link from "next/link";
import { PortalFrame } from "@/components/portal/portal-frame";
import { UserChip } from "@/components/portal/user-chip";
import { adminDb } from "@/server/demo";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: { default: "Admin console", template: "%s · The Convert Club" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = await adminDb();
  const user = await requireAdmin();
  const now = new Date();
  const [overdueCount, overdueReviewCount] = await Promise.all([
    db.session.count({ where: { status: "CONFIRMED", startsAt: { lt: now }, feedback: null } }),
    db.review.count({ where: { status: { not: "COMPLETED" }, dueAt: { lt: now } } }),
  ]);

  return (
    <PortalFrame
      role="admin"
      titleOverrides={{ "/admin": { title: `Good ${greeting()}, ${user.name?.split(" ")[0]?.replace(/\(.*\)/, "").trim() || "Samrudh"}` } }}
      topRight={
        <>
          {user.mentorProfile?.isAdminMentor && user.mentorProfile.status === "ACTIVE" && (
            <Link href="/mentor" className="inline-flex items-center rounded-lg border border-line-strong bg-white px-2.5 py-[7px] text-[11.5px] font-semibold text-ink no-underline hover:border-ink hover:no-underline">Mentor mode →</Link>
          )}
          {overdueCount > 0 && (
            <Link href="/admin/sessions?filter=overdue" className="inline-flex items-center gap-[7px] rounded-lg border border-oxblood-line bg-oxblood-tint px-2.5 py-[7px] text-[11.5px] font-semibold leading-none text-oxblood no-underline hover:no-underline">
              <span aria-hidden className="size-1.5 rounded-full bg-oxblood" />
              {overdueCount} feedback overdue
            </Link>
          )}
          {overdueReviewCount > 0 && (
            <Link href="/admin/reviews?filter=overdue" className="inline-flex items-center gap-[7px] rounded-lg border border-oxblood-line bg-oxblood-tint px-2.5 py-[7px] text-[11.5px] font-semibold leading-none text-oxblood no-underline hover:no-underline">
              <span aria-hidden className="size-1.5 rounded-full bg-oxblood" />
              {overdueReviewCount} review{overdueReviewCount === 1 ? "" : "s"} overdue
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
