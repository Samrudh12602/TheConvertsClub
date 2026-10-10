import { MessageComposer, MessageThread } from "@/components/portal/message-thread";
import { PortalPage } from "@/components/portal/portal-page";
import { Panel } from "@/components/portal/ui";
import { getThread } from "@/server/messages";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function StudentMessages() {
  const user = await requireStudent();
  const thread = await getThread(user.id);
  return (
    <PortalPage width="max-w-[700px]">
      <MessageThread
        messages={thread.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        otherLabel="The Converts Club team"
        empty="No messages yet. Ask us anything about your plan, a session, or a payment."
      />
      <Panel title="Message the team" flush={false}>
        <MessageComposer placeholder="How can we help?" />
      </Panel>
    </PortalPage>
  );
}
