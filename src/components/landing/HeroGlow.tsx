"use client";
import { useRef } from "react";

/** Wraps content and renders emerald glow:
 *  - optional permanent glow anchored to the top (`topGlow`), always on;
 *  - a smaller radial glow that follows the cursor, resting at `baseOpacity`
 *    and brightening to full while the pointer moves over the area.
 *  Touch devices just see the resting/top glow. Updates are rAF-throttled and
 *  only mutate a CSS variable (compositor-only), so it stays smooth. */
export default function HeroGlow({
  children,
  radius = 240,
  restX = "50%",
  restY = "40%",
  baseOpacity = 0,
  topGlow = false,
  className = "",
}: {
  children: React.ReactNode;
  radius?: number;
  restX?: string;
  restY?: string;
  baseOpacity?: number;
  topGlow?: boolean;
  className?: string;
}) {
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
    if (glowRef.current) glowRef.current.style.opacity = String(baseOpacity);
  };

  return (
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} className={`relative isolate ${className}`}>
      {/* Permanent top glow — always on. */}
      {topGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(650px circle at 50% 0%, rgba(52,211,153,0.16), transparent 70%)" }}
        />
      )}
      {/* Cursor-following glow. */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 blur-2xl transition-opacity duration-500 motion-reduce:transition-none"
        style={{
          opacity: baseOpacity,
          background: `radial-gradient(${radius}px circle at var(--gx, ${restX}) var(--gy, ${restY}), rgba(52,211,153,0.22), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
