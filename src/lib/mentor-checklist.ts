export interface ChecklistItem { key: string; label: string; done: boolean; href: string; hint: string }

/** What a mentor must do before students can actually book them. Pure, so it is easy to test. */
export function mentorChecklist(m: { bio: string | null; photoKey: string | null; photoUrl: string | null; payoutEncrypted: string | null; futureOpenSlots: number }): ChecklistItem[] {
  return [
    { key: "availability", label: "Publish your available hours", done: m.futureOpenSlots > 0, href: "/mentor/availability", hint: "Students can't book you until you do. Add this week's hours." },
    { key: "bio", label: "Write a two-line bio", done: Boolean(m.bio?.trim()), href: "/mentor/profile", hint: "Shown on the Mentors page: your background and what you're good at." },
    { key: "photo", label: "Add a professional photo", done: Boolean(m.photoKey || m.photoUrl), href: "/mentor/profile", hint: "Students trust a face." },
    { key: "payout", label: "Add your payout details", done: Boolean(m.payoutEncrypted), href: "/mentor/profile", hint: "So we can pay you. Stored encrypted." },
  ];
}

export const checklistProgress = (items: ChecklistItem[]) => ({ done: items.filter((i) => i.done).length, total: items.length });
