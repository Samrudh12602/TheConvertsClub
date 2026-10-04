import { NextResponse, type NextRequest } from "next/server";
import { findReferral, REF_COOKIE, REF_DAYS } from "@/server/referral";

/**
 * A mentor's shareable link: convertsclub.in/r/ROHKU272. Remembers the code for 30 days so prices across
 * the site show what the visitor pays with it, and checkout applies it for them. An unknown or switched-off
 * code just lands on the normal packages page — it never errors and never sets anything.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const res = NextResponse.redirect(new URL("/packages", req.url));
  const ref = await findReferral(code);
  if (ref) res.cookies.set(REF_COOKIE, ref.code, { maxAge: REF_DAYS * 86_400, path: "/", sameSite: "lax", httpOnly: true, secure: req.nextUrl.protocol === "https:" });
  return res;
}
