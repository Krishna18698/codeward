/** Wraps content and renders a static emerald glow:
 *  - optional permanent glow anchored to the top (`topGlow`);
 *  - an optional resting radial glow at `restX`/`restY`, shown at `baseOpacity`.
 *
 *  Deliberately pure CSS with no pointer tracking — an earlier version followed
 *  the cursor via mousemove, but repainting a large blurred gradient every frame
 *  janked the page. Being handler-free also keeps this a server component, so it
 *  ships no JavaScript at all. */
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
  return (
    <div className={`relative isolate ${className}`}>
      {/* Permanent top glow. */}
      {topGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(650px circle at 50% 0%, rgba(52,211,153,0.16), transparent 70%)" }}
        />
      )}
      {/* Resting glow — skipped entirely when it would be invisible. */}
      {baseOpacity > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
          style={{
            opacity: baseOpacity,
            background: `radial-gradient(${radius}px circle at ${restX} ${restY}, rgba(52,211,153,0.22), transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
