/** The free checklist people get for leaving an email. Shown on the page after sign-up and sent by email. */
export interface GuideStep { when: string; do: string }

export const GUIDE_TITLE = "The 48-hour interview checklist";

export const GUIDE_STEPS: GuideStep[] = [
  { when: "48 hours before", do: "Re-read your application form line by line. Every claim on it is fair game, so be ready to defend each one with an example." },
  { when: "48 hours before", do: "Write your 90-second “tell me about yourself”, then say it out loud twice. If it sounds like a CV being read, rewrite it as a story." },
  { when: "48 hours before", do: "List five stories in one line each: a leadership moment, a failure, a conflict, a decision under pressure, something you are proud of. Most questions are one of these in disguise." },
  { when: "24 hours before", do: "Current affairs: three headlines from your sector, three from the economy, and one contentious issue where you can argue both sides calmly." },
  { when: "24 hours before", do: "Prepare “why MBA, why this institute, why now” in under two minutes, and check it doesn't contradict your SOP." },
  { when: "24 hours before", do: "Academics: for every subject you listed as a favourite, be able to explain the basics to a stranger." },
  { when: "The night before", do: "Lay out your documents, photo ID, call letter and photocopies. Stop studying early. Sleep is worth more than one more read." },
  { when: "Morning of", do: "Be early. If it's online, test your link, camera and audio, and keep water (not coffee) beside you." },
  { when: "In the room", do: "Pause before you answer. Give two or three points, not a speech. If you don't know, say so and reason aloud: panels reward thinking, not bluffing." },
  { when: "Within an hour after", do: "Write down every question you were asked, while you still remember. It is the best preparation for your next call." },
];
