import { ShellScreen } from "@/components/portal/shell-screen";

export default function AdminShellPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <ShellScreen role="admin" params={params} />;
}
