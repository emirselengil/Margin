import type { ReactNode } from "react";

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-bg text-ink">
      <aside className="box-border flex flex-[1_1_236px] flex-col gap-[22px] p-3 min-[820px]:sticky min-[820px]:top-0 min-[820px]:h-screen min-[820px]:self-start min-[820px]:overflow-y-auto">
        {sidebar}
      </aside>
      <main className="m-2 flex min-w-0 flex-[999_1_560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-panel)]">
        {children}
      </main>
    </div>
  );
}
