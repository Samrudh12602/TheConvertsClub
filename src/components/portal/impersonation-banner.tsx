"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, X } from "lucide-react";

function BannerInner() {
  const params = useSearchParams();
  const router = useRouter();
  const adminView = params.get("admin_view");
  const name = params.get("name");

  if (!adminView) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-navy-950 px-4 py-2.5 text-sm text-white">
      <Eye size={15} className="text-gold-400" />
      <span>
        Viewing as {name ?? (adminView === "mentor" ? "Mentor" : "Student")}. Read-only.
      </span>
      <button onClick={() => router.push("/admin" as never)} className="flex items-center gap-1 font-semibold text-gold-400 hover:text-gold-300">
        <X size={13} /> Exit
      </button>
    </div>
  );
}

export function ImpersonationBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
