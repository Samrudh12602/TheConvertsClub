"use client";

import { useRouter } from "next/navigation";
import { LucideIcon, Inbox, AlertOctagon, ShieldAlert, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-sunken/40 px-6 py-14 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-muted">
        <Icon size={22} />
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <Button variant="outline" size="sm" onClick={() => router.push(action.href as never)}>
            {action.label}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-hairline bg-surface px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertOctagon size={22} />
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function NoPermissionState({ role }: { role?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-hairline bg-surface px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
        <ShieldAlert size={22} />
      </div>
      <div>
        <p className="font-semibold text-ink">You don&apos;t have access to this</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          {role ? `This area is restricted to the ${role} role.` : "Ask an admin to update your permissions."}
        </p>
      </div>
    </div>
  );
}

export function OfflineState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-hairline bg-surface px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-muted">
        <WifiOff size={22} />
      </div>
      <p className="font-semibold text-ink">You&apos;re offline</p>
      <p className="text-sm text-muted">Check your connection and try again.</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-[var(--radius-sm)] bg-sunken", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-5">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
