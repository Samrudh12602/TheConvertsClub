import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-start justify-center gap-3 px-5">
      <p className="type-eyebrow text-oxblood">404</p>
      <h1 className="type-page text-ink">That page isn&apos;t here</h1>
      <p className="text-sm leading-[1.6] text-ink-muted">It may have moved, or the link is wrong.</p>
      <Link href="/" className="text-sm font-semibold">
        Back to the home page
      </Link>
    </main>
  );
}
