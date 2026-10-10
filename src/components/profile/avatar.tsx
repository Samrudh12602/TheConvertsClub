import clsx from "clsx";
import { initials } from "@/lib/format";

/** A person's photo (served privately to them and the admin) or their initials. `avatarKey` busts the cache when the photo changes. */
export function UserAvatar({ userId, name, avatarKey, className }: { userId: string; name?: string | null; avatarKey?: string | null; className?: string }) {
  const base = clsx("flex flex-none items-center justify-center overflow-hidden rounded-full bg-line-soft font-semibold leading-none text-ink-2", className ?? "size-[30px] text-[11.5px]");
  if (avatarKey) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={`/api/avatar/${userId}?v=${encodeURIComponent(avatarKey.split("/").pop() ?? "")}`} alt="" className={clsx(base, "object-cover")} />;
  }
  return <span aria-hidden className={base}>{initials(name)}</span>;
}
