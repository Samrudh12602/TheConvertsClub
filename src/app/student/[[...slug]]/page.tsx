import { ShellScreen } from "@/components/portal/shell-screen";

export default function StudentShellPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <ShellScreen role="student" params={params} />;
}
