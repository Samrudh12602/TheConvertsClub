import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="flex items-center justify-between px-5 sm:px-8 py-5">
        <Logo />
        <ThemeToggle />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pb-10">{children}</main>
    </div>
  );
}
