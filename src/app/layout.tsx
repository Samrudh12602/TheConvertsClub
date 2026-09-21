import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque } from "next/font/google";
import { appUrl } from "@/lib/env";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "The Convert Club — GDPI prep by recent converts", template: "%s · The Convert Club" },
  description:
    "Mock PIs, GD/GE, WAT and SOP reviews with mentors who converted last season. One mock or the whole season, priced in the open.",
  openGraph: { siteName: "The Convert Club", type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#F6F3EE" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${archivo.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
