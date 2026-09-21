"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Save, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RubricSlider } from "@/components/ui/rubric-slider";
import { sessions } from "@/lib/data";

const SNIPPETS: Record<string, string> = {
  strengths: "Clear structure, confident delivery, strong resume recall.",
  weaknesses: "Runs long on open-ended questions; needs tighter answers.",
};

export function FeedbackClient() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const session = sessions.find((s) => s.id === params.sessionId) ?? sessions[0];

  const [rubric, setRubric] = useState({ communication: 3, content: 3, profileKnowledge: 3, crossQuestioning: 3, confidence: 3, instituteFit: 3 });
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [answerFraming, setAnswerFraming] = useState("");
  const [questionsToPrepare, setQuestionsToPrepare] = useState("");
  const [recommendation, setRecommendation] = useState("Ready");
  const [privateNote, setPrivateNote] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })), 1200);
    return () => clearTimeout(id);
  }, [strengths, weaknesses, redFlags, answerFraming, questionsToPrepare, privateNote, rubric]);

  if (submitted) {
    return (
      <div className="mx-auto max-w-md text-center py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">Feedback submitted</h1>
        <p className="mt-2 text-muted">
          {session.studentName} has been notified. This session&apos;s earning is now accrued to your account.
        </p>
        <Button size="lg" className="mt-8" onClick={() => router.push("/mentor/sessions" as never)}>
          Back to sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Feedback</h1>
          <p className="text-sm text-muted mt-0.5">
            {session.type} with {session.studentName}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Save size={13} /> {savedAt ? `Draft saved ${savedAt}` : "Saving…"}
        </span>
      </div>

      <Card>
        <CardHeader title="Rubric" subtitle="Rate each dimension from 1 (weak) to 5 (strong)" />
        <div className="space-y-5">
          <RubricSlider label="Communication" value={rubric.communication} onChange={(v) => setRubric((r) => ({ ...r, communication: v }))} />
          <RubricSlider label="Content and structure" value={rubric.content} onChange={(v) => setRubric((r) => ({ ...r, content: v }))} />
          <RubricSlider label="Profile knowledge" value={rubric.profileKnowledge} onChange={(v) => setRubric((r) => ({ ...r, profileKnowledge: v }))} />
          <RubricSlider label="Cross-questioning" value={rubric.crossQuestioning} onChange={(v) => setRubric((r) => ({ ...r, crossQuestioning: v }))} />
          <RubricSlider label="Confidence" value={rubric.confidence} onChange={(v) => setRubric((r) => ({ ...r, confidence: v }))} />
          <RubricSlider label="Institute fit" value={rubric.instituteFit} onChange={(v) => setRubric((r) => ({ ...r, instituteFit: v }))} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-ink">Strengths</p>
          <button
            type="button"
            onClick={() => setStrengths((s) => (s ? s + " " : "") + SNIPPETS.strengths)}
            className="flex items-center gap-1 text-xs font-semibold text-brand"
          >
            <Sparkles size={12} /> Insert snippet
          </button>
        </div>
        <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="What went well?" />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-ink">Weaknesses</p>
          <button
            type="button"
            onClick={() => setWeaknesses((s) => (s ? s + " " : "") + SNIPPETS.weaknesses)}
            className="flex items-center gap-1 text-xs font-semibold text-brand"
          >
            <Sparkles size={12} /> Insert snippet
          </button>
        </div>
        <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="What needs work?" />
      </Card>

      <Card>
        <Textarea label="Red flags" value={redFlags} onChange={(e) => setRedFlags(e.target.value)} placeholder="Anything concerning that could hurt them in the real interview?" />
      </Card>

      <Card>
        <Textarea label="Answer-framing suggestions" value={answerFraming} onChange={(e) => setAnswerFraming(e.target.value)} placeholder="How should they structure their answers differently?" />
      </Card>

      <Card>
        <Textarea label="Questions to prepare next" value={questionsToPrepare} onChange={(e) => setQuestionsToPrepare(e.target.value)} placeholder="What should they be ready for next time?" />
      </Card>

      <Card>
        <Select label="Overall recommendation" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
          <option>Ready</option>
          <option>Needs another round</option>
          <option>Strong convert</option>
        </Select>
      </Card>

      <Card>
        <Textarea label="Private note to Admin" hint="Not visible to the student." value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} placeholder="Optional — flag anything Admin should know." />
      </Card>

      <Button size="lg" fullWidth onClick={() => setSubmitted(true)}>
        Submit feedback
      </Button>
    </div>
  );
}
