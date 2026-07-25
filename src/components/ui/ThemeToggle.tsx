"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

/** Light/dark toggle. Uses a mounted guard so the icon only renders after
 *  hydration — the server can't know the persisted theme, so rendering either
 *  icon during SSR would mismatch. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  // Mount guard: the server can't know the persisted theme, so we render a
  // neutral icon until after hydration. This one-shot flip is the intended
  // use of an effect (sync React to a post-hydration fact), not a cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isLight = resolvedTheme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={mounted ? `Switch to ${isLight ? "dark" : "light"} mode` : "Toggle theme"}
      title={mounted ? `Switch to ${isLight ? "dark" : "light"} mode` : undefined}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:text-primary hover:border-border-accent ${className}`}
    >
      {/* Keep the box stable before mount; swap the glyph once we know the theme. */}
      {mounted && isLight ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
