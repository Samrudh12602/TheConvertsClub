"use client";

import { useEffect, useState } from "react";

const COLORS = ["#7a1f2b", "#b07a1e", "#17665f", "#932836", "#e0b45a", "#2b2a7a"];
/** Deterministic "random" so the same burst renders on the server and the client. */
const rand = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

/** A short burst of confetti for a happy moment (payment confirmed). Hidden for reduced-motion users; removes itself after a few seconds. */
export function Confetti({ count = 46 }: { count?: number }) {
  const [gone, setGone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGone(true), 5400); return () => clearTimeout(t); }, []);
  if (gone) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden motion-reduce:hidden">
      {Array.from({ length: count }, (_, i) => {
        const size = 6 + rand(i, 1) * 7;
        const round = rand(i, 2) > 0.55;
        return (
          <i
            key={i}
            className="absolute block"
            style={{
              left: `${rand(i, 3) * 100}%`, top: 0, width: size, height: round ? size : size * 0.5, background: COLORS[i % COLORS.length], borderRadius: round ? "50%" : 2,
              animation: `confetti-fall ${2.4 + rand(i, 4) * 1.8}s ${rand(i, 5) * 0.7}s cubic-bezier(0.25,0.6,0.4,1) forwards`,
              ["--dx" as string]: `${(rand(i, 6) - 0.5) * 220}px`, ["--rot" as string]: `${Math.round(360 + rand(i, 7) * 720)}deg`,
            }}
          />
        );
      })}
    </div>
  );
}
