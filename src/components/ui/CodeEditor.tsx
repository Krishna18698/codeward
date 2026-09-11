"use client";
// Shared CodeMirror 6 editor — editable + read-only. Replaces the hand-rolled
// <pre>+line-number rendering the workspaces used to duplicate. Meant to be
// imported via next/dynamic({ ssr: false }) so CodeMirror stays out of the
// server bundle and only loads on the workspace pages that use it.
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, indentOnInput, bracketMatching, StreamLanguage, defaultHighlightStyle } from "@codemirror/language";
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

/** Chrome for the editor. The background stays transparent in both themes so the
 *  surrounding WindowFrame's `bg-surface` shows through — which is exactly why
 *  the colours below have to be theme-aware: a single hardcoded `#e5e5e5`
 *  foreground was pale grey on the white light-mode surface (1.26:1).
 *
 *  Everything that carries colour is listed in both palettes: text, gutters and
 *  line numbers, the active-line band, caret, selection and matching brackets.
 */
function editorTheme(dark: boolean) {
  const fg          = dark ? "#e5e5e5" : "#171717";
  // Light gutter is --color-muted, not a lighter grey: line numbers are content
  // you read, and #a3a3a3 on white is 2.3:1.
  const gutterFg    = dark ? "#525252" : "#737373";
  const activeGutter= dark ? "#a3a3a3" : "#525252";
  const activeLine  = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.035)";
  // Emerald-400 reads on near-black; the light page needs emerald-700, the same
  // step --color-accent takes in the [data-theme="light"] block.
  const caret       = dark ? "#34d399" : "#047857";
  const selection   = dark ? "rgba(52,211,153,0.18)" : "rgba(4,120,87,0.16)";
  const bracket     = dark ? "rgba(52,211,153,0.15)" : "rgba(4,120,87,0.14)";

  return EditorView.theme(
    {
      "&": { backgroundColor: "transparent", color: fg, fontSize: "12.5px" },
      ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, monospace", lineHeight: "1.6" },
      ".cm-content": { caretColor: caret, padding: "10px 0" },
      ".cm-gutters": { backgroundColor: "transparent", color: gutterFg, border: "none" },
      ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 12px", minWidth: "2ch" },
      ".cm-activeLine": { backgroundColor: activeLine },
      ".cm-activeLineGutter": { backgroundColor: "transparent", color: activeGutter },
      "&.cm-focused": { outline: "none" },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: caret },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: selection,
      },
      ".cm-matchingBracket": { backgroundColor: bracket, color: "inherit" },
    },
    { dark },
  );
}

/** Chrome + syntax tokens as one unit — oneDark's palette is built for dark
 *  surfaces and washes out on white, so the highlight style swaps with the
 *  theme rather than staying pinned. */
function themeExtension(dark: boolean): Extension {
  return [
    editorTheme(dark),
    syntaxHighlighting(dark ? oneDarkHighlightStyle : defaultHighlightStyle),
  ];
}

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

  // enableSystem is off on the provider, so this is only ever "dark" | "light" —
  // but it is undefined for the first render before next-themes hydrates, and
  // the site is dark-first, so that resolves to dark.
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  // Compartments let us reconfigure language / read-only / theme without
  // rebuilding the whole editor (which would drop history and jump the cursor).
  const langComp = useRef(new Compartment());
  const roComp = useRef(new Compartment());
  const themeComp = useRef(new Compartment());

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
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        themeComp.current.of(themeExtension(dark)),
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

  // Reconfigure the theme when it flips. Going through the compartment (rather
  // than remounting the editor) is what keeps undo history and the cursor
  // position across a theme switch mid-edit.
  useEffect(() => {
    viewRef.current?.dispatch({ effects: themeComp.current.reconfigure(themeExtension(dark)) });
  }, [dark]);

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
