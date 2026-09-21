import { signOutAction } from "@/app/actions/auth";
import { initials } from "@/lib/format";

export function UserChip({ name }: { name?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span title={name ?? ""} className="flex size-[30px] items-center justify-center rounded-full bg-line-soft text-[11.5px] font-semibold leading-none text-ink-2">
        {initials(name)}
      </span>
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
