import clsx from "clsx";

/** Padded content column under the shared top bar. */
export function PortalPage({ width = "max-w-[1100px]", children }: { width?: string; children: React.ReactNode }) {
  return <div className={clsx("flex w-full flex-1 flex-col gap-4 p-5", width)}>{children}</div>;
}
