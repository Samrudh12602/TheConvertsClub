"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removeAvatarAction, uploadAvatarAction } from "@/app/profile/actions";
import { UserAvatar } from "@/components/profile/avatar";

/** Change or remove the profile photo. */
export function AvatarUploader({ userId, name, avatarKey }: { userId: string; name: string | null; avatarKey: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement | null>(null);
  const [pending, start] = useTransition();
  const upload = (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData(); fd.set("file", file);
    start(async () => { const r = await uploadAvatarAction(fd); if (r.ok) { toast.success(r.message ?? "Done."); router.refresh(); } else toast.error(r.error); if (input.current) input.current.value = ""; });
  };
  const remove = () => start(async () => { const r = await removeAvatarAction(); if (r.ok) { toast.success(r.message ?? "Done."); router.refresh(); } else toast.error(r.error); });
  return (
    <div className="flex items-center gap-4">
      <UserAvatar userId={userId} name={name} avatarKey={avatarKey} className="size-20 text-2xl" />
      <div className="flex flex-col items-start gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="avatar-file" onChange={(e) => upload(e.target.files?.[0])} />
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => input.current?.click()}><Camera className="size-4" aria-hidden />{avatarKey ? "Change photo" : "Add a photo"}</Button>
        {avatarKey && <button type="button" disabled={pending} onClick={remove} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-oxblood"><Trash2 className="size-3.5" aria-hidden />Remove</button>}
        <p className="text-[11px] text-ink-faint">JPG, PNG or WEBP, up to 5 MB.</p>
      </div>
    </div>
  );
}
