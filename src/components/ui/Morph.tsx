"use client";

import { MorphIcon, type MorphIconProps } from "morphicons/react";

/** A lucide icon that morphs into another instead of snapping.
 *
 *  Used only where an icon represents a *toggle* — open/closed, light/dark,
 *  shown/hidden. The morph carries the meaning of the state change, so it earns
 *  the motion; a static icon that merely changes on navigation does not, and
 *  should stay a plain lucide component.
 *
 *  Two defaults differ from the library's:
 *  - `reducedMotion="user"` — the library animates regardless by default. Every
 *    other animation on this site honours the OS setting, so this one does too;
 *    with motion reduced the morph degrades to an instant swap.
 *  - `strokeWidth={2}` and `absoluteStrokeWidth` off, matching lucide-react, so
 *    a morphing icon sits at the same visual weight as the static ones beside it.
 *
 *  Icon data comes from the `lucide` core package (plain path arrays), not from
 *  `lucide-react` components — the morph interpolates path geometry, so it needs
 *  the data rather than a rendered component. */
export default function Morph({ size = 16, strokeWidth = 2, ...props }: MorphIconProps) {
  return <MorphIcon reducedMotion="user" size={size} strokeWidth={strokeWidth} {...props} />;
}
