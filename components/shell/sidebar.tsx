import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SidebarBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex h-10 items-center gap-2.5 px-1.5">
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent">
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5 5.5h10M5 10h6M5 14.5h10"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-semibold">Margin</div>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
    </div>
  );
}

export function SidebarNav({ children }: { children: ReactNode }) {
  return <nav className="flex flex-col gap-0.5">{children}</nav>;
}

export function SidebarNavLink({
  href,
  icon: Icon,
  active,
  badge,
  children,
}: {
  href: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "flex h-[38px] items-center gap-2.5 rounded-[9px] px-2.5 no-underline " +
        (active
          ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(0,0,0,0.04)]"
          : "text-ink-2")
      }
    >
      <Icon size={17} stroke={active ? "var(--accent)" : "currentColor"} aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {badge}
    </Link>
  );
}

export function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

export function SidebarSpacer() {
  return <div className="grow" />;
}

export function SidebarUserCard({
  initials,
  avatarClassName,
  name,
  roleLabel,
  signOutAction,
}: {
  initials: string;
  avatarClassName?: string;
  name: string;
  roleLabel: string;
  signOutAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5">
      <div
        className={
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold text-white " +
          (avatarClassName ?? "bg-accent")
        }
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-xs text-muted">{roleLabel}</div>
      </div>
      {signOutAction ? (
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Çıkış yap"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" />
            </svg>
          </button>
        </form>
      ) : null}
    </div>
  );
}
