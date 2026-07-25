"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/** sonner's Toaster, wired to the active theme so toasts match light/dark. */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-right"
      richColors
    />
  );
}
