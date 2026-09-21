import { cn } from "@/lib/cn";

const PALETTE = ["var(--gold-500)", "var(--navy-700)", "var(--info)", "var(--violet)", "var(--success)"];

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  shape = "circle",
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  shape?: "circle" | "square";
  className?: string;
}) {
  const dims = { width: size, height: size };
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-[var(--radius-md)]";

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={dims} className={cn(radiusClass, "object-cover shrink-0", className)} />;
  }

  return (
    <div
      style={{ ...dims, backgroundColor: hashColor(name) }}
      className={cn(radiusClass, "flex shrink-0 items-center justify-center font-bold text-white", className)}
    >
      <span style={{ fontSize: size * 0.38 }}>{initials(name)}</span>
    </div>
  );
}
