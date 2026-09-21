import { PortalPage } from "@/components/portal/portal-page";
import { faqs } from "@/lib/content";

export const metadata = { title: "Help" };

export default async function HelpPage() {
  const items = await faqs();
  return (
    <PortalPage width="max-w-[700px]">
      {items.map((h) => (
        <div key={h.q} className="rounded-[10px] border border-line bg-card p-[15px]">
          <h2 className="text-[13.5px] font-semibold leading-[1.35] text-ink">{h.q}</h2>
          <p className="mt-[7px] text-pretty text-[13px] leading-[1.6] text-ink-muted">{h.a}</p>
        </div>
      ))}
    </PortalPage>
  );
}
