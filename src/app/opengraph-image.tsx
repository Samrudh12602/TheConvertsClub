import { ImageResponse } from "next/og";
import { gdpiComingSoon } from "@/server/site-mode";

export const alt = "The Convert Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card shown when the site is shared on WhatsApp, LinkedIn, X or iMessage. */
export const dynamic = "force-dynamic";

export default async function OpengraphImage() {
  const snap = await gdpiComingSoon();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#16130f", color: "#f6f3ee", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: "#7a1f2b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>C</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>The Convert Club</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>{snap ? "SNAP 2026 mocks, on the real exam screen." : "Mocks with last year's converts."}</div>
          <div style={{ fontSize: 32, color: "#cfc7bb", maxWidth: 900 }}>{snap ? "60 questions, 60 minutes, then an analysis of what went wrong." : "Mock PIs, GD/GE, WAT and SOP reviews — priced in the open, no sales call."}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#b9afa1" }}>
          <span>The Convert Club</span>
          <span>{snap ? "SNAP mocks, student-led" : "GDPI prep, student-led"}</span>
        </div>
      </div>
    ),
    size,
  );
}
