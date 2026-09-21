import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { createReview, ReviewError } from "@/server/reviews";

export const runtime = "nodejs";

/** Student submits a WAT or SOP as a file (PDF/DOCX, 5 MB) or pasted text. Reserves one credit. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await rateLimit(`upload:${user.id}`, 10, 3600)).ok) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });

  const fd = await req.formData().catch(() => null);
  const kind = z.enum(["WAT", "SOP_BASIC", "SOP_DETAILED"]).safeParse(fd?.get("kind"));
  if (!fd || !kind.success) return NextResponse.json({ error: "Choose what you're submitting." }, { status: 400 });
  const file = fd.get("file");
  const text = typeof fd.get("text") === "string" ? String(fd.get("text")) : undefined;
  const title = typeof fd.get("title") === "string" ? String(fd.get("title")).slice(0, 120) : undefined;
  try {
    const review = await createReview(user.id, kind.data, {
      file: file instanceof File && file.size > 0 ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) } : undefined,
      text, title,
    });
    return NextResponse.json({ ok: true, id: review.id });
  } catch (e) {
    if (e instanceof ReviewError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("upload failed", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
