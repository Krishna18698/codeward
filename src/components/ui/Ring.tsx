// SVG circular progress ring (shared by dashboard stats and code-review scores).
// The default stroke is the accent TOKEN, not a hex — a hardcoded emerald stayed
// dark-theme green on the light page.
export function Ring({ pct, size = 56, stroke = 4, color = "var(--color-accent)" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        // Tweens from the previous real value. 0.8s read as sluggish next to
        // the 320ms bars; both now share --duration-progress.
        style={{ transition: "stroke-dashoffset var(--duration-progress) var(--ease-out-soft)" }}
      />
    </svg>
  );
}
