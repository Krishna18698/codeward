"use client";
import { useEffect, useState } from "react";

// SVG circular progress ring (shared by dashboard stats and code-review scores).
// The default stroke is the accent TOKEN, not a hex — a hardcoded emerald stayed
// dark-theme green on the light page.
export function Ring({
  pct,
  size = 56,
  stroke = 4,
  color = "var(--color-accent)",
  fillOnMount = false,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  /** Fill from empty when the ring first appears — for a score being revealed.
   *  Without it a ring mounts already at its value: a CSS transition only runs
   *  when the value changes, so a freshly graded result just appeared full. */
  fillOnMount?: boolean;
}) {
  const [shown, setShown] = useState(fillOnMount ? 0 : pct);
  useEffect(() => {
    // A frame later, so the browser has painted the empty ring to tween from.
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (shown / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        // Tweens from the previous real value. 0.8s read as sluggish next to
        // the 320ms bars, so value changes share --duration-progress; the
        // one-off reveal gets longer so the fill reads as a moment.
        style={{
          transition: fillOnMount
            ? "stroke-dashoffset 700ms var(--ease-out-soft)"
            : "stroke-dashoffset var(--duration-progress) var(--ease-out-soft)",
        }}
      />
    </svg>
  );
}
