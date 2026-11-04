"use client";
import { useEffect } from "react";
import { loadLanguage, type EditorLanguage } from "@/components/ui/codeLanguages";

/** Warms the lazy CodeMirror chunk in the background while the user is on a
 *  catalog page, so opening a workspace doesn't show a "Loading editor…" flash.
 *  Renders nothing. Drop it on pages that link into an editor workspace.
 *
 *  `language` is the one the workspace opens with — only that grammar is
 *  warmed, now that each language is its own chunk. */
export default function PreloadCodeEditor({ language }: { language: EditorLanguage }) {
  useEffect(() => {
    const preload = () => {
      void import("@/components/ui/CodeEditor");
      void loadLanguage(language).catch(() => {});
    };
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
  }, [language]);
  return null;
}
