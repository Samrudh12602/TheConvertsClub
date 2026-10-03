import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminInbox, sendEmail } from "@/server/email";
import { notify } from "@/server/notify";
import { rateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";

const TOPICS = ["Payments & receipts", "Booking a session", "Becoming a mentor", "Something isn't working", "Something else"] as const;
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(3000, "That's too long — keep it under 3000 characters"),
  website: z.string().optional(), // honeypot: real people never fill this
});

/** Public contact form. Emails the owner (reply goes straight to the sender) and sends the sender a receipt. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`contact:${ip}`, 5, 3600)).ok) return NextResponse.json({ error: "Too many messages from this connection. Try again in an hour." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot: pretend success, send nothing

  const inbox = adminInbox();
  if (!inbox) return NextResponse.json({ error: "Messages aren't being accepted right now. Please email us directly." }, { status: 503 });

  const name = oneLine(d.name);
  await sendEmail({ template: "contact_message", to: inbox, replyTo: d.email, vars: { name, topic: d.topic, message: d.message }, details: [{ k: "From", v: `${name} <${d.email}>` }, { k: "Topic", v: d.topic }] });
  await sendEmail({ template: "contact_received", to: d.email, vars: { name } });
  const admins = await db.user.findMany({ where: { role: "ADMIN", isDemo: false }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, { title: `Message from ${name}: ${d.topic}`, body: d.message.slice(0, 140), href: "/admin/communications" })));
  return NextResponse.json({ ok: true });
}
