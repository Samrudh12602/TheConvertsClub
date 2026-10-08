import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock, FileText, Gift, Inbox, MessageSquare, ShieldAlert, Trash2 } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Kpi, KpiGrid } from "@/components/portal/ui";
import { loadInbox, loadWatchlist, type InboxGroup } from "@/server/inbox";
import { requireAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

const ICON = { clock: Clock, calendar: CalendarClock, inbox: Inbox, file: FileText, gift: Gift, message: MessageSquare, alert: AlertTriangle, trash: Trash2 } as const;
const TONE: Record<string, string> = { oxblood: "bg-oxblood-tint text-oxblood", amber: "bg-gold-tint text-gold-deep", indigo: "bg-indigo-tint text-indigo" };

export default async function AdminInbox() {
  const admin = await requireAdmin();
  const [groups, watch] = await Promise.all([loadInbox(admin.isDemo), loadWatchlist()]);
  const open = groups.filter((g) => g.total > 0);
  const total = open.reduce((n, g) => n + g.total, 0);
  const flagged = watch.failedPayments.length + watch.trialRetries.length + watch.manyCarts.length;

  return (
    <PortalPage width="max-w-[1100px]">
      <KpiGrid>
        <Kpi label="Needs you" value={total} note={total ? `Across ${open.length} area${open.length === 1 ? "" : "s"}` : "All clear"} noteTone={total ? "oxblood" : "green"} icon={total ? <Inbox /> : <CheckCircle2 />} accent={total ? "oxblood" : "teal"} />
        <Kpi label="Feedback overdue" value={groups.find((g) => g.key === "overdue")?.total ?? 0} note="Mentors late with feedback" icon={<Clock />} accent="gold" />
        <Kpi label="Unassigned" value={groups.find((g) => g.key === "unassigned")?.total ?? 0} note="Sessions with no mentor" icon={<CalendarClock />} accent="indigo" />
        <Kpi label="Watchlist" value={flagged} note={flagged ? "Patterns worth a look" : "Nothing unusual"} noteTone={flagged ? "amber" : "green"} icon={<ShieldAlert />} accent={flagged ? "gold" : "teal"} />
      </KpiGrid>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal-line bg-gradient-to-br from-teal-tint to-white px-6 py-12 text-center shadow-card">
          <span className="flex size-14 items-center justify-center rounded-full bg-teal text-white shadow-glow"><CheckCircle2 className="size-7" aria-hidden /></span>
          <h2 className="font-display text-[20px] font-bold text-ink">Inbox zero</h2>
          <p className="max-w-[44ch] text-[13px] leading-normal text-ink-muted">Nothing is waiting on you. New feedback delays, unassigned sessions, applications and messages will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{open.map((g) => <Group key={g.key} g={g} />)}</div>
      )}

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card" aria-label="Watchlist">
        <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-gold-tint text-gold-deep"><ShieldAlert aria-hidden className="size-[18px]" /></span><div><h2 className="font-display text-[15.5px] font-bold leading-[1.2] text-ink">Watchlist</h2><p className="mt-0.5 text-xs text-ink-faint">Patterns worth a second look. Counts only; you decide what they mean.</p></div></div>
        {flagged === 0 ? <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-ink-muted">Nothing unusual in the last week: no repeated failed payments, no trial retries, no stacks of abandoned carts.</p> : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Pattern title="Repeated failed payments" sub="3 or more in 7 days" rows={watch.failedPayments} />
            <Pattern title="Trial retries blocked" sub="2 or more in 30 days" rows={watch.trialRetries} />
            <Pattern title="Many unfinished carts" sub="6 or more in 7 days" rows={watch.manyCarts} />
          </div>
        )}
      </section>
    </PortalPage>
  );
}

function Group({ g }: { g: InboxGroup }) {
  const Icon = ICON[g.icon];
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-card shadow-card">
      <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-oxblood-tint text-oxblood"><Icon aria-hidden className="size-[18px]" /></span>
        <h2 className="min-w-0 flex-1 text-[13.5px] font-bold leading-[1.3] text-ink">{g.label}</h2>
        <span className="tnum rounded-full bg-oxblood px-2.5 py-1 text-[11px] font-bold leading-none text-white">{g.total}</span>
      </div>
      <ul className="flex-1">
        {g.items.map((i) => (
          <li key={i.id} className="border-b border-line-soft last:border-b-0">
            <Link href={i.href} className="flex items-center gap-3 px-4 py-2.5 text-inherit no-underline transition-colors hover:bg-surface hover:no-underline">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-body">{i.title}</span>
              <span className={`flex-none rounded-full px-2.5 py-1 text-[10.5px] font-semibold leading-none ${TONE[i.tone ?? "indigo"]}`}>{i.meta}</span>
            </Link>
          </li>
        ))}
        {g.total > g.items.length && <li className="px-4 py-2 text-[11.5px] text-ink-faint">and {g.total - g.items.length} more</li>}
      </ul>
      <Link href={g.href} className="flex items-center justify-between rounded-b-2xl border-t border-line-soft px-4 py-3 text-xs font-semibold text-oxblood no-underline hover:bg-oxblood-tint/40 hover:no-underline">{g.cta}<ArrowRight aria-hidden className="size-4" /></Link>
    </section>
  );
}

function Pattern({ title, sub, rows }: { title: string; sub: string; rows: { who: string; n: number }[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <p className="text-[12.5px] font-semibold text-ink">{title}</p>
      <p className="text-[11px] text-ink-faint">{sub}</p>
      {rows.length === 0 ? <p className="mt-3 text-xs text-ink-faint">None</p> : <ul className="mt-2.5 flex flex-col gap-1.5">{rows.slice(0, 6).map((r) => <li key={r.who} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate text-ink-2">{r.who}</span><span className="tnum flex-none rounded-full bg-gold-tint px-2 py-0.5 font-semibold text-gold-deep">{r.n}×</span></li>)}</ul>}
    </div>
  );
}
