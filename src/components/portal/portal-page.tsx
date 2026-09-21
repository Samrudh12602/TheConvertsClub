import clsx from "clsx";

/** Sticky top bar (title + sub-title, optional right-hand actions) followed by the padded content column. */
export function PortalPage({
  title,
  sub,
  crumb,
  actions,
  width = "max-w-[1100px]",
  children,
}: {
  title: string;
  sub?: string;
  /** Admin shows a small uppercase breadcrumb above the title instead of a sub-title. */
  crumb?: string;
  actions?: React.ReactNode;
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-[5] flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-[13px]">
        <div className="min-w-0 flex-[1_1_200px]">
          {crumb && <p className="type-label mb-1 text-ink-faint">{crumb}</p>}
          <h1 className="font-display text-[19px] font-bold leading-[1.2] text-ink">{title}</h1>
          {sub && <p className="mt-[3px] text-xs leading-[1.3] text-ink-faint">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={clsx("flex w-full flex-1 flex-col gap-4 p-5", width)}>{children}</div>
    </>
  );
}
