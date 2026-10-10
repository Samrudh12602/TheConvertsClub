import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";
import { studentStage, type LockedKey } from "@/server/student-kind";

/** Put at the top of an interview-prep screen: a student without a plan is sent to the "not open yet" page instead of an empty screen. */
export async function guardGdpi(feature: LockedKey) {
  const user = await requireStudent();
  if ((await studentStage(db, user.id)) !== "gdpi") redirect(`/student/locked/${feature}`);
}
