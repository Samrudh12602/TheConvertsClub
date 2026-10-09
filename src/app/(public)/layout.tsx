import { auth } from "@/auth";
import { SiteHeader } from "@/components/site/site-header";
import { SiteAnalytics } from "@/components/site/analytics";
import { SiteFooter } from "@/components/site/site-footer";
import { gdpiComingSoon } from "@/server/site-mode";
import { roleHome } from "@/lib/roles";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const comingSoon = await gdpiComingSoon();
  const account = session?.user ? { role: session.user.role, home: roleHome(session.user.role) } : null;
  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader account={account} comingSoon={comingSoon} />
      <main id="main">{children}</main>
      <SiteFooter account={account} comingSoon={comingSoon} />
      <SiteAnalytics />
    </div>
  );
}
