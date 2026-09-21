"use client";

import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  onRowClick,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-lg)] border border-hairline bg-surface", className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-hairline bg-sunken/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide whitespace-nowrap",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-hairline last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-sunken/60"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 text-ink whitespace-nowrap",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="px-4 py-14 text-center text-sm text-muted">No results found.</div>}
    </div>
  );
}
