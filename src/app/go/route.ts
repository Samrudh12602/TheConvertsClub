import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { roleHome } from "@/lib/roles";

/** Post-login landing: send each role to its own portal. */
export async function GET(req: NextRequest) {
  const session = await auth();
  return NextResponse.redirect(new URL(session?.user ? roleHome(session.user.role) : "/login", req.url));
}
