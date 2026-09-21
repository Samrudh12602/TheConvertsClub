"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function FieldWrap({ label, hint, error, required, className, children, id }: FieldWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const fieldBase =
  "w-full rounded-[var(--radius-sm)] border bg-surface px-3.5 h-11 text-[15px] text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrap label={label} hint={hint} error={error} required={required} id={inputId}>
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldBase, error ? "border-danger" : "border-hairline focus:border-brand", className)}
          {...props}
        />
      </FieldWrap>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className, id, rows = 4, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrap label={label} hint={hint} error={error} required={required} id={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            fieldBase,
            "h-auto py-2.5 resize-y",
            error ? "border-danger" : "border-hairline focus:border-brand",
            className
          )}
          {...props}
        />
      </FieldWrap>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <FieldWrap label={label} hint={hint} error={error} required={required} id={inputId}>
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldBase, "appearance-none bg-no-repeat", error ? "border-danger" : "border-hairline focus:border-brand", className)}
          {...props}
        >
          {children}
        </select>
      </FieldWrap>
    );
  }
);
Select.displayName = "Select";
