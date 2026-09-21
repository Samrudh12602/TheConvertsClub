import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PortalPage } from "@/components/portal/portal-page";
import { portals, resolveScreen, type PortalRole } from "@/lib/portal-nav";

/**
 * Catch-all body for every portal route that has no dedicated page yet. A real page at the same path
 * (e.g. src/app/student/book/page.tsx) takes precedence automatically, so screens replace this one by one.
 */
export async function ShellScreen({ role, params }: { role: PortalRole; params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const config = portals[role];
  const screen = resolveScreen(config, [config.base, ...slug].join("/"));
  if (!screen) notFound();

  const crumb = role === "admin" ? screen.sub : undefined;
  return (
    <PortalPage title={screen.title} sub={role === "admin" ? undefined : screen.sub} crumb={crumb}>
      <Notice>Shell only. Sign-in and data aren&apos;t wired yet, so nothing real shows on this screen. It is hidden entirely in production.</Notice>
      <Card className="text-sm leading-[1.6] text-ink-muted">This screen has a design but isn&apos;t built yet. See docs/DESIGN_MAP.md for its status.</Card>
    </PortalPage>
  );
}
