import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/portal/notification-bell";
import { UserAvatar } from "@/components/profile/avatar";

/** The notification bell, the person's photo (a link to their profile) and sign-out. */
export function UserChip({ name, userId, avatarKey, profileHref }: { name?: string | null; userId: string; avatarKey?: string | null; profileHref: string }) {
  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <Link href={profileHref} title={`${name ?? "Your"} profile`} aria-label="Open your profile" className="rounded-full ring-offset-2 ring-offset-paper transition hover:ring-2 hover:ring-oxblood/40 focus-visible:ring-2 focus-visible:ring-oxblood">
        <UserAvatar userId={userId} name={name} avatarKey={avatarKey} />
      </Link>
      <form action={signOutAction}>
        <button type="submit" className="min-h-9 rounded-lg px-2 text-xs font-medium text-ink-muted hover:bg-line-soft hover:text-ink">
          Sign out
        </button>
      </form>
    </div>
  );
}

/** Pill used in topbars: oxblood tint (countdowns), amber (due soon). */
export function TopPill({ tone = "oxblood", children }: { tone?: "oxblood" | "amber"; children: React.ReactNode }) {
  const t = tone === "amber" ? "border-amber-line bg-amber-tint text-amber" : "border-oxblood-line bg-oxblood-tint text-oxblood";
  const dot = tone === "amber" ? "bg-amber" : "bg-oxblood";
  return (
    <div className={`flex items-center gap-[7px] rounded-lg border px-2.5 py-[7px] ${t}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span className="text-[11.5px] font-semibold leading-none">{children}</span>
    </div>
  );
}
