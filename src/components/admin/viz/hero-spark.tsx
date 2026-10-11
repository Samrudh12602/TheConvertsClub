/** A large soft area line for the dark hero banner (gold on dark). */
export function HeroSpark({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 420, h = 130;
  const empty = data.length < 2 || data.every((v) => v === 0);
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * (w - 8) + 4, h - 14 - (v / max) * (h - 34)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Revenue over the last 30 days" className="max-w-[440px]">
      <defs><linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e6b556" stopOpacity="0.45" /><stop offset="100%" stopColor="#e6b556" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="4" x2={w - 4} y1={h - 14 - f * (h - 34)} y2={h - 14 - f * (h - 34)} stroke="white" strokeOpacity="0.07" strokeDasharray="3 6" />)}
      {empty ? (
        <path d={`M4,${h - 40} C60,${h - 70} 110,${h - 20} 170,${h - 58} S280,${h - 90} ${w - 4},${h - 56}`} fill="none" stroke="#e6b556" strokeOpacity="0.4" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" />
      ) : (
        <>
          <path d={`${line} L${w - 4},${h} L4,${h} Z`} fill="url(#hero-fill)" />
          <path d={line} fill="none" stroke="#f0c36b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4.5" fill="#f0c36b" stroke="#0f0c09" strokeWidth="2" />
        </>
      )}
      <text x="4" y={h - 1} fontSize="10" fill="white" fillOpacity="0.45">{labels[0]}</text>
      <text x={w - 4} y={h - 1} fontSize="10" textAnchor="end" fill="white" fillOpacity="0.45">{labels[labels.length - 1]}</text>
    </svg>
  );
}
