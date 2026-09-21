import clsx from "clsx";
import { useId } from "react";

interface FieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
}

/** Uppercase-label field. 16px text on small screens so iOS doesn't zoom on focus. */
export function Field({ label, error, hint, className, id, ...rest }: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div>
      <label htmlFor={inputId} className="type-label mb-1.5 block text-ink-faint">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          "min-h-11 w-full rounded-lg border bg-white px-3 py-3 text-base leading-none text-ink placeholder:text-ink-faint md:text-[13px]",
          error ? "border-oxblood" : "border-line-strong",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-err`} role="alert" className="mt-1.5 text-xs text-oxblood">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
