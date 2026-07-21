"use client";
// Shared CodeMirror 6 editor — editable + read-only. Replaces the hand-rolled
// <pre>+line-number rendering the workspaces used to duplicate. Meant to be
// imported via next/dynamic({ ssr: false }) so CodeMirror stays out of the
// server bundle and only loads on the workspace pages that use it.
import { useEffect, useRef } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, indentOnInput, bracketMatching, StreamLanguage } from "@codemirror/language";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { kotlin, csharp } from "@codemirror/legacy-modes/mode/clike";

export type EditorLanguage =
  | "typescript" | "javascript" | "nodejs" | "python" | "kotlin" | "csharp" | "go" | "java";

function languageExtension(language: EditorLanguage): Extension {
  switch (language) {
    case "typescript": return javascript({ typescript: true });
    case "javascript":
    case "nodejs": return javascript();
    case "python": return python();
    case "java": return java();
    case "go": return go();
    case "kotlin": return StreamLanguage.define(kotlin);
    case "csharp": return StreamLanguage.define(csharp);
    default: return [];
  }
}

// Chrome styled to sit inside the app's dark WindowFrame (transparent bg so the
// frame's bg-surface shows through); token colours come from oneDark's palette.
const appTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", color: "#e5e5e5", fontSize: "12.5px" },
    ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace", lineHeight: "1.6" },
    ".cm-content": { caretColor: "#34d399", padding: "10px 0" },
    ".cm-gutters": { backgroundColor: "transparent", color: "#525252", border: "none" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 12px", minWidth: "2ch" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#a3a3a3" },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#34d399" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(52,211,153,0.18)",
    },
    ".cm-matchingBracket": { backgroundColor: "rgba(52,211,153,0.15)", color: "inherit" },
  },
  { dark: true },
);

type Props = {
  value: string;
  onChange?: (value: string) => void;
  language: EditorLanguage;
  readOnly?: boolean;
  /** Min height of the editor viewport. */
  minHeight?: string;
  className?: string;
};

export default function CodeEditor({ value, onChange, language, readOnly = false, minHeight = "320px", className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Compartments let us reconfigure language / read-only without rebuilding the
  // whole editor (which would drop history and jump the cursor).
  const langComp = useRef(new Compartment());
  const roComp = useRef(new Compartment());

  // Create the editor once, on mount.
  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(oneDarkHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        appTheme,
        EditorView.lineWrapping,
        EditorView.theme({ "&": { minHeight } }),
        langComp.current.of(languageExtension(language)),
        roComp.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Intentionally mount-only; language/readOnly/value syncing handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconfigure language when it changes.
  useEffect(() => {
    viewRef.current?.dispatch({ effects: langComp.current.reconfigure(languageExtension(language)) });
  }, [language]);

  // Reconfigure read-only when it changes.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: roComp.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
    });
  }, [readOnly]);

  // Push external value changes in (e.g. re-seeding a skeleton on language
  // switch) without clobbering in-progress typing: only replace when different.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={hostRef} className={className} />;
}
