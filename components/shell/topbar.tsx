import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function Topbar({ crumbs, right }: { crumbs: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-2">
      <div className="flex items-center gap-2 text-muted">{crumbs}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

export function CrumbSeparator() {
  return <ChevronRight size={14} aria-hidden="true" />;
}
