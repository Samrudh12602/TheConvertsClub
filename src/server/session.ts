import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { roleHome } from "@/lib/roles";
import type { Role } from "@/generated/prisma/client";

/** The signed-in user, re-read from the database (so suspensions and role changes apply immediately). */
export const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true, mentorProfile: true },
  });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) return null;
  return user;
});

/**
 * Server-side role guard. Call at the top of every page, server action and route handler that touches
 * role-specific data. Admin may enter the mentor area (Mentor mode) only if they have a mentor profile.
 */
export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const allowed = roles.includes(user.role) || (user.role === "ADMIN" && roles.includes("MENTOR") && !!user.mentorProfile);
  if (!allowed) redirect(roleHome(user.role));
  return user;
}

export async function requireMentor() {
  const user = await requireRole("MENTOR");
  if (!user.mentorProfile) redirect(roleHome(user.role));
  return { user, mentor: user.mentorProfile };
}

export async function requireStudent() {
  return requireRole("STUDENT");
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
