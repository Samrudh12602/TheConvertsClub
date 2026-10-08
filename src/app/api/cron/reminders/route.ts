import { NextResponse, type NextRequest } from "next/server";
import { cronGuard } from "@/server/cron-auth";
import { abandonedCheckouts, chaseMentorFeedback, sendMentorReminders } from "@/server/automations";
import { sendReminders } from "@/server/reminders";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  // Each step is independent: one failing must not stop the others.
  const run = async <T,>(f: () => Promise<T>) => { try { return await f(); } catch (e) { console.error("cron step failed", e); return { error: true }; } };
  return NextResponse.json({ ok: true, student: await run(sendReminders), mentor: await run(sendMentorReminders), feedback: await run(chaseMentorFeedback), abandoned: await run(abandonedCheckouts) });
}
