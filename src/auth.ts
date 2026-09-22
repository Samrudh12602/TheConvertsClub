import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { DEMO_ACCOUNTS } from "@/lib/roles";
import { demoMode } from "@/lib/env";
import { safeEqual } from "@/server/crypto";
import { rateLimit } from "@/server/ratelimit";
import { sendEmail } from "@/server/email";
import { audit } from "@/server/audit";
import { verifyPassword } from "@/server/password";

const adminEmail = () => process.env.ADMIN_EMAIL?.trim().toLowerCase();

/** ADMIN_EMAIL is the one seeded Admin. Anyone else is a student until invited as a mentor. */
async function promoteIfAdmin(email: string | null | undefined) {
  if (!email || email.toLowerCase() !== adminEmail()) return;
  await db.user.updateMany({ where: { email: email.toLowerCase(), role: { not: "ADMIN" } }, data: { role: "ADMIN" } });
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const googleEnabled = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const emailLoginEnabled = () => Boolean(process.env.RESEND_API_KEY);

export const { handlers, auth, signIn, signOut, unstable_update: refreshSession } = NextAuth({
  adapter: PrismaAdapter(db as never),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: { signIn: "/login", verifyRequest: "/login?sent=1", error: "/login?error=1" },
  providers: [
    ...(googleEnabled() ? [Google({ allowDangerousEmailAccountLinking: false })] : []),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "The Convert Club <onboarding@resend.dev>",
      maxAge: 24 * 60 * 60,
      async sendVerificationRequest({ identifier, url }) {
        const r = await sendEmail({ template: "magic_link", to: identifier, url });
        if (r.status !== "SENT") throw new Error(`Login email not sent (${r.status})`);
      },
    }),
    Credentials({
      id: "demo",
      name: "Demo access",
      credentials: { email: {}, passcode: {} },
      async authorize(raw) {
        if (!demoMode()) return null;
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const passcode = String(raw?.passcode ?? "");
        const rl = await rateLimit(`demo-login:${await clientIp()}`, 10, 900);
        if (!rl.ok) return null;
        const account = DEMO_ACCOUNTS.find((a) => a.email === email);
        const expected = account ? process.env[account.env] : undefined;
        if (!account || !expected || !safeEqual(passcode, expected)) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isDemo || user.status !== "ACTIVE") return null;
        await audit({ actorId: user.id, action: "auth.demo_login", entity: "User", entityId: user.id, ip: await clientIp() });
        return { id: user.id, email: user.email, name: user.name, role: user.role } as never;
      },
    }),
    Credentials({
      id: "password",
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;
        const ip = await clientIp();
        // Rate-limited per IP and per email separately, so one doesn't let the other be brute-forced.
        const [byIp, byEmail] = await Promise.all([rateLimit(`pw-login-ip:${ip}`, 20, 900), rateLimit(`pw-login-email:${email}`, 8, 900)]);
        if (!byIp.ok || !byEmail.ok) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.status !== "ACTIVE" || user.deletedAt) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;
        await audit({ actorId: user.id, action: "auth.password_login", entity: "User", entityId: user.id, ip });
        return { id: user.id, email: user.email, name: user.name, role: user.role } as never;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        await promoteIfAdmin(user.email);
        const u = await db.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (u && (u.status !== "ACTIVE" || u.deletedAt)) return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) token.uid = user.id;
      // Re-read role/status from the database on sign-in and every 5 minutes, so role changes and suspensions apply quickly.
      const stale = trigger === "update" || !token.checkedAt || Date.now() - token.checkedAt > 5 * 60 * 1000;
      if (token.uid && (user || stale)) {
        const u = await db.user.findUnique({ where: { id: token.uid }, select: { role: true, status: true, deletedAt: true } });
        if (!u || u.status !== "ACTIVE" || u.deletedAt) return null;
        token.role = u.role;
        token.checkedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await promoteIfAdmin(user.email);
    },
  },
});
