import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type AuthHeaderProps = {
  prompt: string;
  linkHref: string;
  linkLabel: string;
};

export function AuthHeader({ prompt, linkHref, linkLabel }: AuthHeaderProps) {
  return (
    <header className="flex h-[72px] items-center justify-between px-8">
      <Logo />
      <div className="flex items-center gap-3">
        <span className="hidden text-[13px] text-muted sm:inline">{prompt}</span>
        <Link
          href={linkHref}
          className="flex h-9 items-center rounded-[9px] border border-line bg-surface px-3.5 font-medium text-ink no-underline"
        >
          {linkLabel}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
