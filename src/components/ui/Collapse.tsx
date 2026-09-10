"use client";
import { useId, type ReactNode } from "react";

/** An animated collapsible region.
 *
 *  Every collapsible surface in the app was a conditional render
 *  (`{open && <div>…</div>}`), which means the content unmounts the instant you
 *  click — there is nothing left on the page to animate, so closing was always
 *  an instant cut no matter what transition was declared. This keeps the wrapper
 *  mounted and animates `grid-template-rows` from `0fr` to `1fr`, which is the
 *  one way to transition to a height the browser has to measure.
 *
 *  Honest about the cost: this animates layout, not just the compositor. It is
 *  fine for a pattern group; do not wrap hundreds of rows in one instance.
 *
 *  Behaviour it guarantees, which hand-rolled versions kept getting wrong:
 *  - Reverses mid-flight. A second click animates from wherever it is now,
 *    because the transition is on a style that is simply re-targeted.
 *  - Never blocks its trigger — there is no "animating" state to wait on.
 *  - Collapsed content leaves the tab order (`inert`), so keyboard users don't
 *    tab into invisible rows.
 *  - Under `prefers-reduced-motion` the transition is dropped by the global
 *    rule in globals.css, so it snaps to the final state with content visible.
 */
export default function Collapse({
  open,
  children,
  id,
  className = "",
}: {
  open: boolean;
  children: ReactNode;
  /** Pass the id referenced by the trigger's `aria-controls`. */
  id?: string;
  className?: string;
}) {
  const autoId = useId();
  const regionId = id ?? autoId;

  return (
    <div
      id={regionId}
      // `grid` + a single `0fr`/`1fr` row is the animatable-height trick. The
      // duration differs by direction: closing is quicker, because a slow
      // collapse reads as the UI being reluctant to get out of the way.
      className={`grid ${className}`}
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: `grid-template-rows ${open ? "var(--duration-expand, 260ms)" : "var(--duration-collapse, 200ms)"} ${
          open ? "var(--ease-out-soft)" : "var(--ease-exit)"
        }`,
      }}
    >
      {/* min-height:0 is load-bearing — without it a grid item refuses to
          shrink below its content and the row never reaches 0fr. */}
      <div
        className="min-h-0 overflow-hidden"
        // `inert` also removes it from the accessibility tree and blocks
        // pointer events, so a mid-collapse click can't hit a hidden row.
        inert={!open}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
