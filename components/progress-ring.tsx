const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const ratio = total > 0 ? done / total : 0;
  const dash = `${(ratio * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle
        cx="20"
        cy="20"
        r={RADIUS}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </svg>
  );
}
