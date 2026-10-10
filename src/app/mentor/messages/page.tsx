import { MessageComposer, MessageThread } from "@/components/portal/message-thread";
import { PortalPage } from "@/components/portal/portal-page";
import { Panel } from "@/components/portal/ui";
import { getThread } from "@/server/messages";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function Messages() {
  const { user } = await requireMentor();
  const thread = await getThread(user.id);
  return (
    <PortalPage width="max-w-[700px]">
      <MessageThread
        messages={thread.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
        otherLabel="The Converts Club team"
        empty="No messages yet. Write to us here about sessions, pay or anything you need."
      />
      <Panel title="Message the team" flush={false}>
        <MessageComposer placeholder="Write to the team…" />
      </Panel>
    </PortalPage>
  );
}
