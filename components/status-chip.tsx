export function StatusChip({ tone, children }: { tone: "pos" | "neg" | "wait"; children: React.ReactNode }) {
  const classes =
    tone === "pos"
      ? "bg-accent-soft text-accent-text"
      : tone === "neg"
        ? "bg-warn-soft text-warn-text"
        : "border border-dashed border-line-2 bg-sunken text-muted";
  return (
    <span
      className={`inline-flex h-[26px] items-center whitespace-nowrap rounded-[7px] px-2.5 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}
