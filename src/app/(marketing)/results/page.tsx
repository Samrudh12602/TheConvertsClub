import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { testimonials } from "@/lib/data";

const CONVERTED_WALL = [
  { name: "Aarav Mehta", institute: "SIBM Pune" },
  { name: "Sanya Kapoor", institute: "SPJIMR Mumbai" },
  { name: "Vikram Suresh", institute: "NMIMS Mumbai" },
  { name: "[Student Name]", institute: "[Institute]" },
  { name: "[Student Name]", institute: "[Institute]" },
  { name: "[Student Name]", institute: "[Institute]" },
];

export default function ResultsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Results</h1>
        <p className="mt-3 text-muted">
          Real feedback from students who converted their calls. Numbers below are placeholders until Year 1 results are verified.
        </p>
      </div>

      {/* Converted wall */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold text-ink text-center mb-6">The converted wall</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {CONVERTED_WALL.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-hairline bg-surface p-5 text-center">
              <Avatar name={c.name.includes("[") ? "??" : c.name} size={48} />
              <p className="text-sm font-semibold text-ink">{c.name}</p>
              <Badge variant="success">Converted · {c.institute}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-16">
        <h2 className="font-display text-xl font-semibold text-ink text-center mb-6">In their words</h2>
        <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <Card key={t.id}>
              <p className="text-sm text-ink leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={t.name} size={36} />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.institute}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Feedback screenshots placeholder */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="font-display text-xl font-semibold text-ink text-center mb-6">Feedback, unfiltered</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex aspect-video items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-sunken/40 text-sm text-muted"
            >
              [Feedback screenshot placeholder]
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
