import Link from "next/link";
import { MessageComposer, MessageThread } from "@/components/portal/message-thread";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { relative } from "@/lib/format";
import { getInbox, getThread } from "@/server/messages";
import { requireAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const [admin, { u }] = await Promise.all([requireAdmin(), searchParams]);
  const [inbox, target] = await Promise.all([
    getInbox(admin.isDemo),
    u ? db.user.findFirst({ where: { id: u, role: { not: "ADMIN" }, deletedAt: null }, select: { id: true, name: true, role: true } }) : null,
  ]);
  const thread = target ? await getThread(target.id) : [];
  const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/i, "") || "Unnamed";

  return (
    <PortalPage>
      <div className="grid items-start gap-4 md:grid-cols-[300px_1fr]">
        <Panel title="Conversations">
          {inbox.length === 0 ? <Empty>No messages yet. Students and mentors write to you from their portal; start one from any student or mentor page.</Empty> : (
            <ul>
              {inbox.map((c) => (
                <li key={c.userId} className="border-b border-line-soft last:border-b-0">
                  <Link href={`/admin/messages?u=${c.userId}`} className={`block px-3.5 py-3 no-underline hover:bg-line-soft hover:no-underline ${c.userId === target?.id ? "bg-line-soft" : ""}`}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold leading-[1.3] text-ink">{c.name}</span>
                      <span className="shrink-0 text-[10.5px] leading-none text-ink-faint">{relative(c.lastAt)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-line-soft px-1.5 py-1 text-[9.5px] font-semibold uppercase leading-none tracking-[0.08em] text-ink-muted">{c.role.toLowerCase()}</span>
                      {c.awaitingReply && <span className="rounded bg-oxblood-tint px-1.5 py-1 text-[9.5px] font-semibold uppercase leading-none tracking-[0.08em] text-oxblood">awaiting reply</span>}
                    </span>
                    <span className="mt-1.5 block truncate text-xs leading-[1.4] text-ink-faint">{c.lastBody}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {target ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-[16px] font-bold leading-[1.2] text-ink">{nm(target.name)}</h2>
              <Link href={target.role === "MENTOR" ? `/admin/mentors` : `/admin/students/${target.id}`} className="text-xs font-semibold text-oxblood">
                {target.role === "MENTOR" ? "All mentors" : "Student profile"}
              </Link>
            </div>
            <MessageThread messages={thread.map((m) => ({ ...m, mine: !m.mine, createdAt: m.createdAt.toISOString() }))} otherLabel={nm(target.name)} empty="No messages with this person yet. Say hello below." />
            <Panel title={`Reply to ${nm(target.name).split(" ")[0]}`} flush={false}>
              <MessageComposer toUserId={target.id} placeholder="Write a reply…" cta="Send reply" />
            </Panel>
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-line-strong bg-card px-4 py-10 text-center text-[13px] leading-normal text-ink-faint">Pick a conversation on the left.</div>
        )}
      </div>
    </PortalPage>
  );
}
