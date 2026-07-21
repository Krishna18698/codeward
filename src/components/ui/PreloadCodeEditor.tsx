"use client";
import { useEffect } from "react";

/** Warms the lazy CodeMirror chunk in the background while the user is on a
 *  catalog page, so opening a workspace doesn't show a "Loading editor…" flash.
 *  Renders nothing. Drop it on pages that link into an editor workspace. */
export default function PreloadCodeEditor() {
  useEffect(() => {
    const preload = () => void import("@/components/ui/CodeEditor");
    // Prefer idle time so it never competes with the catalog's own render.
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    if (ric) {
      const id = ric(preload);
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(preload, 1200);
    return () => clearTimeout(t);
  }, []);
  return null;
}
