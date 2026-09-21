import { Notice } from "@/components/ui/notice";

/** Shown when a form is valid but its backend isn't wired in this environment yet. Never fakes success. */
export function PendingNotice({ children }: { children: React.ReactNode }) {
  return (
    <Notice role="status" className="mt-3">
      {children}
    </Notice>
  );
}
