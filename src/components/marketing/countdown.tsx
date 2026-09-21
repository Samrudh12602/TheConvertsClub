"use client";

import { useEffect, useState } from "react";

function getRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Countdown({ target, className }: { target: Date; className?: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hrs", value: remaining.hours },
    { label: "Min", value: remaining.minutes },
    { label: "Sec", value: remaining.seconds },
  ];

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center rounded-[var(--radius-sm)] bg-navy-950 px-2.5 py-1.5 min-w-[46px]">
          <span className="font-display text-base font-bold tabular-nums text-white leading-none">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-gold-400 mt-0.5">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
