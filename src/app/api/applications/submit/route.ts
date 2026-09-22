import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/server/ratelimit";
import { MentorAdminError, submitApplication } from "@/server/mentors";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: z.string().trim().min(6).max(20),
  institute: z.string().trim().min(3).max(120),
  callsConverted: z.string().trim().min(3).max(500),
  linkedinUrl: z.url().refine((u) => /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(u), "Enter your LinkedIn profile URL"),
  hoursPerWeek: z.coerce.number().int().min(1).max(40),
});

/** Public mentor application (no auth). Requires a real LinkedIn URL and a professional photo. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`apply:${ip}`, 5, 3600)).ok) return NextResponse.json({ error: "Too many applications from this connection. Try again later." }, { status: 429 });

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });

  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Attach a professional photo." }, { status: 400 });

  try {
    await submitApplication({ ...parsed.data, photo: { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof MentorAdminError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("application submit failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
