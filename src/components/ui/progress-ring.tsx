export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "var(--gold-500)",
  trackColor = "var(--bg-sunken)",
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, max === 0 ? 0 : value / max));
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 500ms var(--ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <span className="text-lg font-bold text-ink tabular-nums leading-none">{label}</span>}
        {sublabel && <span className="text-[11px] text-muted mt-1 leading-none">{sublabel}</span>}
      </div>
    </div>
  );
}

export function MiniCreditRing({
  used,
  total,
  label,
}: {
  used: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing value={used} max={total} size={68} strokeWidth={6} label={`${used}/${total}`} />
      <span className="text-xs font-medium text-muted text-center">{label}</span>
    </div>
  );
}
