import type { LucideIcon } from "lucide-react";

export function ComingSoonButton({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title="Yakında"
      className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-muted opacity-70"
    >
      <Icon size={15} aria-hidden="true" />
      {children} <span className="font-normal">· yakında</span>
    </button>
  );
}
