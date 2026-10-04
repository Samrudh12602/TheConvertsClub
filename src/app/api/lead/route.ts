import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { GUIDE_STEPS } from "@/lib/free-guide";
import { sendEmail } from "@/server/email";
import { rateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  tips: z.boolean().optional(),
  website: z.string().optional(), // honeypot
});

/** Free-checklist sign-up: stores the email (and whether they want occasional tips) and emails the checklist. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`lead:${ip}`, 6, 3600)).ok) return NextResponse.json({ error: "Too many requests from this connection. Try again later." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email address." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  await db.lead.upsert({ where: { email }, update: parsed.data.tips ? { tipsConsent: true } : {}, create: { email, source: "free-guide", tipsConsent: Boolean(parsed.data.tips) } });
  await sendEmail({ template: "free_guide", to: email, details: GUIDE_STEPS.map((s) => ({ k: s.when, v: s.do })), url: "/packages" });
  return NextResponse.json({ ok: true });
}
