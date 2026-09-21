import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { getPublicMentors } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mentors",
  description: "Everyone here converted a call in the last two seasons.",
};

export default async function MentorsPage() {
  const mentors = await getPublicMentors();
  const demo = mentors.some((m) => m.demo);
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-[26px]">
      <div>
        <h1 className="type-page text-ink">Who takes your mock</h1>
        <p className="mt-2 max-w-[58ch] text-sm leading-[1.6] text-ink-muted">
          Everyone here converted a call in the last two seasons. We assign based on what you&apos;re preparing for and who is free.
        </p>
      </div>
      {demo && <Notice>Demo profiles, shown outside production only. Real profiles come from the mentors table and expose photo, name, college and a short bio, nothing else.</Notice>}
      {mentors.length === 0 ? (
        <Card className="text-sm leading-[1.6] text-ink-muted">Mentor profiles will be published here before the season opens.</Card>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
          {mentors.map((m) => (
            <li key={m.name}>
              <Card className="h-full">
                <div
                  aria-hidden
                  className="flex aspect-square w-full items-center justify-center rounded-[10px] border border-dashed border-sand-line bg-sand p-3 text-center text-[11.5px] font-medium leading-[1.4] text-ink-faint"
                >
                  Photo
                </div>
                <h2 className="mt-[13px] font-display text-[15px] font-bold leading-tight text-ink">{m.name}</h2>
                <p className="mt-1 text-[11.5px] font-semibold leading-[1.3] text-oxblood">{m.college}</p>
                <p className="mt-2 text-pretty text-[12.5px] leading-[1.6] text-ink-muted">{m.bio}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
