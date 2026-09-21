import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { roleHome } from "@/lib/roles";

/**
 * First line of defence for the three portals: no session -> /login, wrong role -> your own home.
 * Every page and action re-checks on the server (requireRole) and scopes its queries; this only stops
 * unauthenticated traffic early. (Next.js 16 renamed middleware to proxy.)
 */
const AREAS = [
  { prefix: "/student", roles: ["STUDENT"] },
  { prefix: "/mentor", roles: ["MENTOR", "ADMIN"] }, // Admin's Mentor mode; the page checks for a mentor profile
  { prefix: "/admin", roles: ["ADMIN"] },
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
  if (!area) return NextResponse.next();

  const secure = req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: secure,
    salt: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  if (!token?.uid) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (!token.role || !area.roles.includes(token.role)) return NextResponse.redirect(new URL(roleHome(token.role), req.url));

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = { matcher: ["/student/:path*", "/mentor/:path*", "/admin/:path*"] };
