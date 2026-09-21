import { ShellScreen } from "@/components/portal/shell-screen";

export default function MentorShellPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <ShellScreen role="mentor" params={params} />;
}
