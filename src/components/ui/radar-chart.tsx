export function RadarChart({
  axes,
  values,
  max = 5,
  size = 260,
  color = "var(--gold-500)",
}: {
  axes: string[];
  values: number[];
  max?: number;
  size?: number;
  color?: string;
}) {
  const center = size / 2;
  const radius = size / 2 - 36;
  const angleStep = (Math.PI * 2) / axes.length;

  const pointFor = (i: number, value: number) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (value / max) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const dataPoints = values.map((v, i) => pointFor(i, v));
  const polygon = dataPoints.map((p) => p.join(",")).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r) => {
        const pts = axes.map((_, i) => pointFor(i, max * r).join(",")).join(" ");
        return <polygon key={r} points={pts} fill="none" stroke="var(--border-hairline)" strokeWidth={1} />;
      })}
      {axes.map((_, i) => {
        const [x, y] = pointFor(i, max);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--border-hairline)" strokeWidth={1} />;
      })}
      <polygon points={polygon} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={color} />
      ))}
      {axes.map((label, i) => {
        const [x, y] = pointFor(i, max * 1.28);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--text-secondary)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
