import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque } from "next/font/google";
import { appUrl } from "@/lib/env";
import { gdpiComingSoon } from "@/server/site-mode";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

const GDPI_DESCRIPTION = "Mock PIs, GD/GE, WAT and SOP reviews with mentors who converted last season. One mock or the whole season, priced in the open.";
const SNAP_DESCRIPTION = "Full-length SNAP 2026 mocks on the real exam screen: 60 questions, 60 minutes. Instant analysis of what went wrong, worked solutions and a detailed PDF.";

/** The search-result and link-preview text follows the same switch as the pages: SNAP mocks while GDPI prep is "coming soon". */
export async function generateMetadata(): Promise<Metadata> {
  const soon = await gdpiComingSoon();
  const description = soon ? SNAP_DESCRIPTION : GDPI_DESCRIPTION;
  return {
    metadataBase: new URL(appUrl()),
    title: { default: soon ? "The Converts Club: SNAP 2026 mocks on the real exam screen" : "The Converts Club — GDPI prep by recent converts", template: "%s · The Converts Club" },
    description,
    openGraph: { siteName: "The Converts Club", type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#F6F3EE" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${archivo.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved dark theme before first paint (no flash). Portals only: the public site always stays light. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(/^\\/(student|mentor|admin)(\\/|$)/.test(location.pathname)&&localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}` }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
