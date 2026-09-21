import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { publicMentors } from "@/lib/data";

export default function MentorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Your mentors</h1>
        <p className="mt-3 text-muted">Current students and alumni who cracked the same interviews, a season or two ago.</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {publicMentors.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center gap-4">
              <Avatar name={m.name} size={56} />
              <div>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.college} · Batch {m.batch}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink">{m.bio}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.focus.map((f) => (
                <Badge key={f} variant="outline">
                  {f}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-16 max-w-2xl mx-auto text-center rounded-[var(--radius-lg)] border border-hairline bg-navy-950 p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold text-white">Cracked your GDPI last season?</h2>
        <p className="mt-2 text-navy-100 text-sm">Mentor the next batch — flexible hours, paid per session, Jan to Mar.</p>
        <ButtonLink href="/become-a-mentor" className="mt-6">
          Become a mentor
        </ButtonLink>
      </div>
    </div>
  );
}
