const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Tüm etütlerdeki ödev durumu dağılımı (yapıldı / eksik) pasta grafiği. */
export function HomeworkPie({ done, missing, size = 132 }: { done: number; missing: number; size?: number }) {
  const total = done + missing;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
  const summary =
    total === 0
      ? "Henüz ödev kaydı yok"
      : `Ödev yapıldı ${done} (%${donePct}), ödev eksik ${missing} (%${100 - donePct})`;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label={summary}
        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      >
        <circle cx="16" cy="16" r={RADIUS} fill="var(--line)" />
        {total > 0 ? (
          <>
            <circle
              cx="16"
              cy="16"
              r={RADIUS / 2}
              fill="none"
              stroke="var(--warn)"
              strokeWidth={RADIUS}
              strokeDasharray={`${(CIRCUMFERENCE / 2).toFixed(2)} ${(CIRCUMFERENCE / 2).toFixed(2)}`}
            />
            <circle
              cx="16"
              cy="16"
              r={RADIUS / 2}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={RADIUS}
              strokeDasharray={`${((done / total) * (CIRCUMFERENCE / 2)).toFixed(2)} ${(CIRCUMFERENCE / 2).toFixed(2)}`}
            />
          </>
        ) : null}
      </svg>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
        <li className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 shrink-0 rounded-[3px]" style={{ background: "var(--accent)" }} />
          <span className="text-ink-2">✓ Ödev yapıldı</span>
          <span className="font-mono font-medium text-ink">
            {done}
            {total > 0 ? <span className="text-muted"> · %{donePct}</span> : null}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 shrink-0 rounded-[3px]" style={{ background: "var(--warn)" }} />
          <span className="text-ink-2">– Ödev eksik</span>
          <span className="font-mono font-medium text-ink">
            {missing}
            {total > 0 ? <span className="text-muted"> · %{100 - donePct}</span> : null}
          </span>
        </li>
        {total === 0 ? <li className="text-muted">Henüz ödev kaydı yok.</li> : null}
      </ul>
    </div>
  );
}
