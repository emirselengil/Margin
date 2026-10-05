const RADIUS = 16;
// Dilimler r=8, çizgi kalınlığı 16 olan halkalarla çizilir (dolu pasta görünümü).
const ARC_R = RADIUS / 2;
const ARC_LEN = 2 * Math.PI * ARC_R;

/** Üç dilimin yüzdeleri toplamı her zaman 100 olacak şekilde yuvarlanır. */
function percentages(done: number, missing: number, notDone: number) {
  const total = done + missing + notDone;
  if (total === 0) return { done: 0, missing: 0, notDone: 0 };
  const d = Math.round((done / total) * 100);
  const m = Math.round((missing / total) * 100);
  return { done: d, missing: m, notDone: Math.max(0, 100 - d - m) };
}

/** Tüm etütlerdeki ödev durumu dağılımı (yapıldı / eksik / yapmadı) pasta grafiği. */
export function HomeworkPie({
  done,
  missing,
  notDone,
  size = 132,
}: {
  done: number;
  missing: number;
  notDone: number;
  size?: number;
}) {
  const total = done + missing + notDone;
  const pct = percentages(done, missing, notDone);
  const summary =
    total === 0
      ? "Henüz ödev kaydı yok"
      : `Ödev yapıldı ${done} (%${pct.done}), ödev eksik ${missing} (%${pct.missing}), ödev yapmadı ${notDone} (%${pct.notDone})`;

  // Her dilim: başlangıç ofseti + uzunluk
  const arcs = [
    { key: "done", count: done, stroke: "var(--accent)", opacity: 1 },
    { key: "missing", count: missing, stroke: "var(--warn)", opacity: 0.5 },
    { key: "notDone", count: notDone, stroke: "var(--warn)", opacity: 1 },
  ];
  let offset = 0;
  const drawn = arcs.map((a) => {
    const len = total > 0 ? (a.count / total) * ARC_LEN : 0;
    const arc = { ...a, len, offset };
    offset += len;
    return arc;
  });

  const rows = [
    { key: "done", label: "✓ Ödev yapıldı", count: done, pct: pct.done, color: "var(--accent)", opacity: 1 },
    { key: "missing", label: "– Ödev eksik", count: missing, pct: pct.missing, color: "var(--warn)", opacity: 0.5 },
    { key: "notDone", label: "✕ Ödev yapmadı", count: notDone, pct: pct.notDone, color: "var(--warn)", opacity: 1 },
  ];

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
        {drawn
          .filter((a) => a.len > 0)
          .map((a) => (
            <circle
              key={a.key}
              cx="16"
              cy="16"
              r={ARC_R}
              fill="none"
              stroke={a.stroke}
              strokeOpacity={a.opacity}
              strokeWidth={RADIUS}
              strokeDasharray={`${a.len.toFixed(3)} ${ARC_LEN.toFixed(3)}`}
              strokeDashoffset={(-a.offset).toFixed(3)}
            />
          ))}
      </svg>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span
              className="inline-flex h-3 w-3 shrink-0 rounded-[3px]"
              style={{ background: r.color, opacity: r.opacity }}
            />
            <span className="text-ink-2">{r.label}</span>
            <span className="font-mono font-medium text-ink">
              {r.count}
              {total > 0 ? <span className="text-muted"> · %{r.pct}</span> : null}
            </span>
          </li>
        ))}
        {total === 0 ? <li className="text-muted">Henüz ödev kaydı yok.</li> : null}
      </ul>
    </div>
  );
}
