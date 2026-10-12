import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, Paperclip, PenSquare, Reply, Search } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, Panel } from "@/components/portal/ui";
import { buttonClasses } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { MailActions } from "@/components/admin/mail-actions";
import { MailComposer, type ComposerDefaults } from "@/components/admin/mail-composer";
import { MailFrame } from "@/components/admin/mail-frame";
import { formatIstDateTime } from "@/lib/datetime";
import { getProduct } from "@/lib/catalog";
import { buildMailTemplates, priceNote, type MailTemplate } from "@/lib/mail-templates";
import { SENDERS, formatAddress, quoteForReply, replySubject, type SenderKey } from "@/lib/mailbox";
import { MailboxError, automaticLog, listMail, mailboxConfigured, openMail, sentLog, type FolderKey, type MailList, type OpenedMail } from "@/server/mailbox";
import { requireAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const metadata = { title: "Mailbox" };

type Params = Record<string, string | undefined>;
const FOLDERS: { key: FolderKey; label: string }[] = [{ key: "inbox", label: "Inbox" }, { key: "sent", label: "Sent" }, { key: "spam", label: "Spam" }, { key: "trash", label: "Trash" }];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function MailboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const raw = await searchParams;
  const sp: Params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, one(v)]));
  const tab = sp.tab === "log" || sp.tab === "auto" ? sp.tab : "mail";
  const href = (patch: Params) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) q.set(k, v);
    const s = q.toString();
    return `/admin/mailbox${s ? `?${s}` : ""}`;
  };

  return (
    <PortalPage width="max-w-[1240px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Mailbox sections" className="flex flex-wrap gap-1.5">
          {([["mail", "Inbox"], ["log", "Sent log"], ["auto", "Automatic emails"]] as const).map(([k, label]) => (
            <Link key={k} href={`/admin/mailbox?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={clsx("rounded-full px-3.5 py-2.5 text-xs font-medium leading-none no-underline hover:no-underline", tab === k ? "bg-ink text-white" : "border border-line-strong bg-white text-ink-2 hover:border-ink")}>{label}</Link>
          ))}
        </nav>
        <Link href="/admin/mailbox?tab=mail&compose=1" className={buttonClasses({ size: "sm" })}><PenSquare className="size-4" aria-hidden /> Write an email</Link>
      </div>
      {tab === "log" ? <SentLog /> : tab === "auto" ? <AutomaticLog /> : <MailView sp={sp} href={href} />}
    </PortalPage>
  );
}

// ───────────── Inbox ─────────────

async function MailView({ sp, href }: { sp: Params; href: (p: Params) => string }) {
  if (!mailboxConfigured()) return <Flash tone="amber">The mailbox is not connected on this server. It needs SMTP_USER and SMTP_PASS (the admin@ mailbox login). On the live site it is connected.</Flash>;

  const folder = (FOLDERS.find((f) => f.key === sp.folder)?.key ?? "inbox") as FolderKey;
  const page = Math.max(1, Number(sp.page) || 1);
  const alias = SENDERS.find((s) => s.key === sp.to)?.address;
  const uid = Number(sp.uid) || 0;
  const composing = sp.compose === "1" && !uid;

  let templates: MailTemplate[] = [];
  if (composing) {
    const [test, five, ten, upgrade] = await Promise.all(["snap-test-mock", "snap-mocks-5", "snap-mocks-10", "snap-upgrade-10"].map(async (slug) => priceNote(await getProduct(slug))));
    templates = buildMailTemplates({ test, five, ten, upgrade });
  }

  let list: MailList | null = null;
  let opened: OpenedMail | null = null;
  let problem: string | null = null;
  try {
    [list, opened] = await Promise.all([listMail({ folder, page, q: sp.q, alias }), uid ? openMail(folder, uid) : Promise.resolve(null)]);
  } catch (e) {
    problem = e instanceof MailboxError ? e.message : "The mailbox could not be read just now. Try again in a moment.";
    if (!(e instanceof MailboxError)) console.error(e);
  }
  const rightActive = Boolean(opened || composing || uid);

  return (
    <>
      {problem && <Flash tone="oxblood">{problem}</Flash>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <div className={clsx("flex flex-col gap-3", rightActive && "hidden lg:flex")}>
          <div className="flex flex-wrap gap-1.5">
            {FOLDERS.map((f) => (
              <Link key={f.key} href={href({ folder: f.key, uid: undefined, page: undefined, compose: undefined, reply: undefined })} aria-current={folder === f.key ? "page" : undefined} className={clsx("rounded-lg px-3 py-2 text-[12px] font-semibold leading-none no-underline hover:no-underline", folder === f.key ? "bg-oxblood-tint text-oxblood" : "text-ink-muted hover:bg-surface")}>
                {f.label}{f.key === "inbox" && list ? <span className="tnum ml-1.5 text-ink-faint">{list.unseen ? `${list.unseen} new` : ""}</span> : null}
              </Link>
            ))}
          </div>
          <form action="/admin/mailbox" className="flex gap-1.5">
            <input type="hidden" name="tab" value="mail" />
            <input type="hidden" name="folder" value={folder} />
            {sp.to && <input type="hidden" name="to" value={sp.to} />}
            <label className="relative min-w-0 flex-1"><span className="sr-only">Search mail</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden /><input name="q" defaultValue={sp.q} placeholder="Search subject or sender" className="min-h-10 w-full rounded-lg border border-line-strong bg-white pl-8 pr-2.5 text-[13px]" /></label>
            <button className={buttonClasses({ size: "sm", variant: "secondary" })}>Search</button>
          </form>
          <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-faint">
            <span>Sent to:</span>
            {[{ key: undefined, label: "All" }, ...SENDERS.map((s) => ({ key: s.key as string | undefined, label: s.key }))].map((o) => (
              <Link key={o.label} href={href({ to: o.key, uid: undefined, page: undefined })} aria-current={(sp.to ?? undefined) === o.key ? "page" : undefined} className={clsx("rounded-full px-2.5 py-1.5 leading-none no-underline hover:no-underline", (sp.to ?? undefined) === o.key ? "bg-ink text-white" : "border border-line-strong bg-white text-ink-2")}>{o.label}</Link>
            ))}
          </div>
          <Panel>
            {!list ? <Empty art="inbox">Could not load the list.</Empty> : list.rows.length === 0 ? <Empty art="inbox">{sp.q || alias ? "Nothing matches that." : "This folder is empty."}</Empty> : (
              <ul>
                {list.rows.map((m) => (
                  <li key={m.uid} className="border-b border-line-soft last:border-b-0">
                    <Link href={href({ uid: String(m.uid), compose: undefined, reply: undefined })} className={clsx("block px-3.5 py-3 no-underline transition-colors hover:bg-surface hover:no-underline", m.uid === uid && "bg-oxblood-tint/50")}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={clsx("min-w-0 truncate text-[13px]", m.seen ? "text-ink-2" : "font-bold text-ink")}>{!m.seen && <span aria-label="Unread" className="mr-1.5 inline-block size-2 rounded-full bg-oxblood align-middle" />}{folder === "sent" ? `To: ${m.to[0] ?? ""}` : m.from.name || m.from.address}</span>
                        <span className="tnum flex-none text-[11px] text-ink-faint">{m.date ? formatIstDateTime(new Date(m.date)) : ""}</span>
                      </div>
                      <p className={clsx("mt-0.5 truncate text-[12.5px]", m.seen ? "text-ink-muted" : "font-semibold text-ink-2")}>{m.subject}</p>
                      {folder !== "sent" && m.to[0] && <p className="mt-0.5 truncate text-[11px] text-ink-faint">to {m.to[0]}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {list && list.pages > 1 && (
            <div className="flex items-center justify-between text-[12px] text-ink-muted">
              {page > 1 ? <Link href={href({ page: String(page - 1), uid: undefined })} className="font-semibold text-oxblood">← Newer</Link> : <span />}
              <span className="tnum">Page {page} of {list.pages} · {list.total} messages</span>
              {page < list.pages ? <Link href={href({ page: String(page + 1), uid: undefined })} className="font-semibold text-oxblood">Older →</Link> : <span />}
            </div>
          )}
        </div>

        <div className={clsx(!rightActive && "hidden lg:block")}>
          {composing ? (
            <Panel title="New email" flush={false} action={<Link href={href({ compose: undefined })} className="text-[12px] font-semibold text-ink-muted lg:hidden">Close</Link>}>
              <MailComposer doneHref="/admin/mailbox?tab=log" templates={templates} />
            </Panel>
          ) : opened ? (
            <Reader m={opened} href={href} reply={sp.reply === "1"} />
          ) : uid && !problem ? (
            <Empty art="inbox">That message could not be opened.</Empty>
          ) : (
            <Panel flush={false}><Empty art="inbox">Pick a message to read it, or write a new email. Mail sent to support@, admin@, billing@ and samrudh@ all arrives here.</Empty></Panel>
          )}
        </div>
      </div>
    </>
  );
}

function Reader({ m, href, reply }: { m: OpenedMail; href: (p: Params) => string; reply: boolean }) {
  const mine = new Set<string>(SENDERS.map((s) => s.address));
  const receivedAt = [...m.to, ...m.cc].map((a) => a.address.toLowerCase()).find((a) => mine.has(a));
  const fromKey: SenderKey = SENDERS.find((s) => s.address === receivedAt)?.key ?? "support";
  const replyTo = m.folder === "sent" ? m.to[0] : m.from;
  const defaults: ComposerDefaults = {
    from: fromKey,
    to: replyTo?.address ?? "",
    subject: replySubject(m.subject),
    body: quoteForReply(formatAddress(m.from), m.date ? new Date(m.date) : null, m.text),
    thread: { messageId: m.messageId, references: m.references },
  };
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="border-b border-line-soft px-4 py-3.5">
          <Link href={href({ uid: undefined, reply: undefined })} className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted lg:hidden"><ArrowLeft className="size-3.5" aria-hidden /> Back</Link>
          <h2 className="font-display text-[17px] font-bold leading-snug text-ink">{m.subject}</h2>
          <dl className="mt-2 grid gap-0.5 text-[12.5px] text-ink-muted">
            <div className="flex gap-2"><dt className="w-9 flex-none text-ink-faint">From</dt><dd className="min-w-0 break-words">{formatAddress(m.from)}</dd></div>
            <div className="flex gap-2"><dt className="w-9 flex-none text-ink-faint">To</dt><dd className="min-w-0 break-words">{m.to.map(formatAddress).join(", ")}</dd></div>
            {m.cc.length > 0 && <div className="flex gap-2"><dt className="w-9 flex-none text-ink-faint">Cc</dt><dd className="min-w-0 break-words">{m.cc.map(formatAddress).join(", ")}</dd></div>}
            {m.date && <div className="flex gap-2"><dt className="w-9 flex-none text-ink-faint">Date</dt><dd>{formatIstDateTime(new Date(m.date))} IST</dd></div>}
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={href({ reply: "1" })} className={buttonClasses({ size: "sm" })}><Reply className="size-4" aria-hidden /> Reply</Link>
            <MailActions folder={m.folder} uid={m.uid} backHref={href({ uid: undefined, reply: undefined })} />
          </div>
        </div>
        <div className="p-4">
          {m.tooLarge ? <Flash tone="amber">This message is too large to open here (mostly attachments). Open it in Hostinger webmail.</Flash> : <MailFrame html={m.html} text={m.text} />}
          {m.attachments.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Attachments">
              {m.attachments.map((a) => (
                <li key={a.index}><a href={`/api/mailbox/attachment?folder=${m.folder}&uid=${m.uid}&i=${a.index}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-[12px] font-medium text-ink-2 no-underline hover:border-ink hover:no-underline"><Paperclip className="size-3.5" aria-hidden /> {a.filename} <span className="text-ink-faint">{Math.max(1, Math.round(a.size / 1024))} KB</span></a></li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
      {reply && (
        <Panel title={`Reply to ${m.folder === "sent" ? (replyTo?.address ?? "") : (m.from.name || m.from.address)}`} flush={false}>
          <MailComposer defaults={defaults} doneHref="/admin/mailbox?tab=log" />
        </Panel>
      )}
    </div>
  );
}

// ───────────── Logs ─────────────

const STATUS_TONE = { SENT: "green", FAILED: "oxblood", SKIPPED: "stone" } as const;

async function SentLog() {
  const rows = await sentLog();
  return (
    <Panel title={`Sent from this page (${rows.length}${rows.length === 200 ? "+" : ""})`}>
      {rows.length === 0 ? <Empty art="inbox">Nothing sent by hand yet. Emails you write here are logged here, one row per recipient.</Empty> : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="border-b border-line-soft px-4 py-3 last:border-b-0">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
                  <Pill tone={STATUS_TONE[r.status]}>{r.status === "SENT" ? "Sent" : "Failed"}</Pill>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{r.subject}</span>
                  <span className="text-[12px] text-ink-muted">{r.fromAddress} → {r.toAddress}</span>
                  <span className="tnum text-[11.5px] text-ink-faint">{formatIstDateTime(r.createdAt)}</span>
                </summary>
                {r.error && <p className="mt-2 text-[12px] text-oxblood">{r.error}</p>}
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-3 font-sans text-[12.5px] leading-[1.6] text-ink-muted">{r.body}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

async function AutomaticLog() {
  const rows = await automaticLog();
  return (
    <Panel title={`Emails the site sent by itself (latest ${rows.length})`}>
      {rows.length === 0 ? <Empty art="inbox">No automatic emails yet: receipts, reminders and login links show up here.</Empty> : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-soft px-4 py-2.5 last:border-b-0">
              <Pill tone={STATUS_TONE[r.status]}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Pill>
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.subject}</span>
              <span className="text-[12px] text-ink-muted">{r.recipient}</span>
              <span className="rounded bg-line-soft px-1.5 py-1 text-[10.5px] font-medium leading-none text-ink-2">{r.template}</span>
              <span className="tnum text-[11.5px] text-ink-faint">{formatIstDateTime(r.createdAt)}</span>
              {r.error && <span className="basis-full text-[11.5px] text-oxblood">{r.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
