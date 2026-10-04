import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/roles";
import { REF_COOKIE } from "@/server/referral";

/** "Remove" on the referral banner: forget the code and go back where the visitor was. */
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")) ?? "/packages", req.url));
  res.cookies.set(REF_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
