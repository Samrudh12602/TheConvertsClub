import { smoothPath } from "@/lib/metrics";

/** A large soft area line for the dark hero banner (gold on dark). */
export function HeroSpark({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 520, h = 190;
  const empty = data.length < 2 || data.every((v) => v === 0);
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * (w - 12) + 6, h - 24 - (v / max) * (h - 52)] as const);
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Revenue over the last 30 days" className="ml-auto block max-w-[600px]">
      <defs><linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e6b556" stopOpacity="0.5" /><stop offset="100%" stopColor="#e6b556" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1="6" x2={w - 6} y1={h - 24 - f * (h - 52)} y2={h - 24 - f * (h - 52)} stroke="white" strokeOpacity="0.07" strokeDasharray="3 7" />)}
      {empty ? (
        <path d={`M6,${h - 60} C80,${h - 100} 150,${h - 30} 240,${h - 80} S400,${h - 130} ${w - 6},${h - 80}`} fill="none" stroke="#e6b556" strokeOpacity="0.4" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
      ) : (
        <>
          <path d={`${line} L${w - 6},${h - 24} L6,${h - 24} Z`} fill="url(#hero-fill)" />
          <path d={line} fill="none" stroke="#f0c36b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill="#f0c36b" stroke="#0f0c09" strokeWidth="2.5" />
        </>
      )}
      <text x="6" y={h - 4} fontSize="11" fill="white" fillOpacity="0.5">{labels[0]}</text>
      <text x={w - 6} y={h - 4} fontSize="11" textAnchor="end" fill="white" fillOpacity="0.5">{labels[labels.length - 1]}</text>
    </svg>
  );
}
