import type { PrismaClient } from "../src/generated/prisma/client";

/** Remove every demo row (users flagged isDemo and everything hanging off them). Safe to run before launch. */
export async function purgeDemo(db: PrismaClient) {
  const u = { isDemo: true };
  const mentorDemo = { mentor: { user: u } };
  await db.sessionRating.deleteMany({ where: { student: u } });
  await db.feedback.deleteMany({ where: mentorDemo });
  await db.payoutAccrual.deleteMany({ where: mentorDemo });
  await db.bonusAward.deleteMany({ where: mentorDemo });
  await db.payout.deleteMany({ where: mentorDemo });
  await db.payoutRun.deleteMany({ where: { label: { startsWith: "[demo]" } } });
  await db.adjustment.deleteMany({ where: mentorDemo });
  await db.creditLedger.deleteMany({ where: { user: u } });
  await db.session.deleteMany({ where: { OR: [{ student: u }, { mentor: { user: u } }] } });
  await db.gdParticipant.deleteMany({ where: { student: u } });
  await db.gdBatch.deleteMany({ where: { moderator: { user: u } } });
  await db.review.deleteMany({ where: { student: u } });
  await db.slot.deleteMany({ where: mentorDemo });
  await db.availabilityWindow.deleteMany({ where: mentorDemo });
  await db.refund.deleteMany({ where: { payment: { order: { user: u } } } });
  await db.payment.deleteMany({ where: { order: { user: u } } });
  await db.enrollment.deleteMany({ where: { user: u } });
  await db.order.deleteMany({ where: { user: u } });
  await db.notification.deleteMany({ where: { user: u } });
  await db.message.deleteMany({ where: { OR: [{ from: u }, { to: u }] } });
  await db.callTracker.deleteMany({ where: { student: u } });
  await db.studentProfile.deleteMany({ where: { user: u } });
  await db.mentorProfile.deleteMany({ where: { user: u } });
  await db.account.deleteMany({ where: { user: u } });
  await db.auditLog.deleteMany({ where: { actor: u } });
  await db.expense.deleteMany({ where: { note: { startsWith: "[demo]" } } });
  await db.mentorApplication.deleteMany({ where: { notes: { startsWith: "[demo]" } } });
  await db.emailLog.deleteMany({ where: { recipient: { endsWith: "@demo.convertclub.test" } } });
  await db.user.deleteMany({ where: u });
}
