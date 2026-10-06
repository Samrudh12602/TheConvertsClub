import clsx from "clsx";

/** A shimmering placeholder shown while a page's data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-shimmer rounded-lg bg-shimmer", className)} />;
}

/** Generic portal page skeleton: a KPI row and two panels. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5" role="status" aria-label="Loading">
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))" }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)}
      </div>
      <Skeleton className="h-[140px] rounded-xl" />
      <div className="grid gap-3.5 md:grid-cols-2">
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
