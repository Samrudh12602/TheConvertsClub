import { FileText, ClipboardList, ListChecks, ShieldQuestion, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RESOURCES = [
  { icon: FileText, title: "Mock PI framework", description: "Structure for a 60-minute mock: warm-up, resume dive, cross-questioning, close.", type: "Guide" },
  { icon: ClipboardList, title: "Feedback template", description: "The exact structure Admin expects in every feedback submission.", type: "Template" },
  { icon: ListChecks, title: "Evaluation rubric", description: "What each score from 1–5 means, per dimension.", type: "Reference" },
  { icon: ShieldQuestion, title: "Standard question bank", description: "Curated Why MBA, HR-fit and cross-questioning prompts by institute.", type: "Reference" },
  { icon: FileText, title: "Mentor guidelines", description: "Conduct, punctuality and confidentiality expectations.", type: "Policy" },
  { icon: TriangleAlert, title: "Escalation process", description: "What to do if a student is unresponsive, distressed, or a session goes wrong.", type: "Policy" },
];

export default function MentorResourcesPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Resources</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map((r) => (
          <Card key={r.title} className="flex gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-brand">
              <r.icon size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink text-sm">{r.title}</p>
                <Badge variant="outline">{r.type}</Badge>
              </div>
              <p className="text-sm text-muted mt-1">{r.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
