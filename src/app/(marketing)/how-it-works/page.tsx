import { CreditCard, ClipboardList, Stethoscope, PhoneCall, Users, MessageSquareText, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const JOURNEY = [
  { icon: CreditCard, title: "Pay", description: "Choose a package or an individual service and pay securely via Razorpay." },
  { icon: ClipboardList, title: "Onboarding form", description: "Tell us about your college, your calls and your interview dates in a 4-step form." },
  { icon: Stethoscope, title: "Profile diagnosis", description: "We flag your weak areas — communication, content, confidence — before your first session." },
  { icon: PhoneCall, title: "Strategy call", description: "A focused call to plan which mocks to prioritise given your timeline." },
  { icon: Users, title: "Mocks", description: "Book Mock PIs, GD/GE and WAT sessions with mentors matched to your target institutes." },
  { icon: MessageSquareText, title: "Feedback", description: "Detailed, rubric-based feedback after every session — what to fix before the real thing." },
  { icon: Trophy, title: "Real interview", description: "Walk in with a readiness score you can trust, and a booklet built around your profile." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">How it works</h1>
        <p className="mt-3 text-muted">From payment to your final interview, in seven steps.</p>
      </div>

      <div className="mt-14 relative">
        <div className="absolute left-6 top-2 bottom-2 w-px bg-hairline hidden sm:block" />
        <div className="space-y-8">
          {JOURNEY.map((step, i) => (
            <div key={step.title} className="flex gap-5 relative">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-400 z-10">
                <step.icon size={20} />
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-semibold text-accent-strong">STEP {i + 1}</p>
                <h3 className="font-semibold text-ink text-lg mt-0.5">{step.title}</h3>
                <p className="text-sm text-muted mt-1 max-w-md">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 text-center">
        <ButtonLink href="/packages" size="lg">
          See packages
        </ButtonLink>
      </div>
    </div>
  );
}
