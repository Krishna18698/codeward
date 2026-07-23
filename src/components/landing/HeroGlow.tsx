"use client";
import { useRef } from "react";

/** Wraps the hero area and renders an emerald radial glow that follows the
 *  cursor. Rests at top-center (matching the old static glow) until the pointer
 *  moves over it, then tracks the mouse and brightens. Touch devices just see
 *  the resting glow — no regression. Updates are rAF-throttled and only mutate a
 *  CSS variable (compositor-only), so it stays smooth. */
export default function HeroGlow({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onMove = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const wrap = wrapRef.current;
      const glow = glowRef.current;
      if (!wrap || !glow) return;
      const r = wrap.getBoundingClientRect();
      glow.style.setProperty("--gx", `${x - r.left}px`);
      glow.style.setProperty("--gy", `${y - r.top}px`);
      glow.style.opacity = "1";
    });
  };

  const onLeave = () => {
    if (glowRef.current) glowRef.current.style.opacity = ""; // revert to the class default (0.6)
  };

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} className="relative isolate">
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-2xl transition-opacity duration-500 motion-reduce:transition-none"
        style={{
          background:
            "radial-gradient(600px circle at var(--gx, 50%) var(--gy, 14%), rgba(52,211,153,0.20), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
