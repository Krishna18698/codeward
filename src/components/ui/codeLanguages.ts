import type { Extension } from "@codemirror/state";

export type EditorLanguage =
  | "typescript" | "javascript" | "nodejs" | "python" | "kotlin" | "csharp" | "go" | "java";

/** One language per import, loaded the first time an editor needs it.
 *
 *  CodeEditor used to import every grammar up front — JavaScript/TypeScript,
 *  Python, Java, Go and the C-like legacy modes — so opening a C# exercise also
 *  downloaded and parsed four languages it would never show, and the catalog
 *  pages that preload the editor paid for all of them too. */
const LOADERS: Record<EditorLanguage, () => Promise<Extension>> = {
  typescript: async () => (await import("@codemirror/lang-javascript")).javascript({ typescript: true }),
  javascript: async () => (await import("@codemirror/lang-javascript")).javascript(),
  nodejs: async () => (await import("@codemirror/lang-javascript")).javascript(),
  python: async () => (await import("@codemirror/lang-python")).python(),
  java: async () => (await import("@codemirror/lang-java")).java(),
  go: async () => (await import("@codemirror/lang-go")).go(),
  kotlin: async () => {
    const [{ StreamLanguage }, { kotlin }] = await Promise.all([
      import("@codemirror/language"),
      import("@codemirror/legacy-modes/mode/clike"),
    ]);
    return StreamLanguage.define(kotlin);
  },
  csharp: async () => {
    const [{ StreamLanguage }, { csharp }] = await Promise.all([
      import("@codemirror/language"),
      import("@codemirror/legacy-modes/mode/clike"),
    ]);
    return StreamLanguage.define(csharp);
  },
};

const loaded = new Map<EditorLanguage, Promise<Extension>>();

/** The language's editor extension; each one is fetched once per page load. */
export function loadLanguage(language: EditorLanguage): Promise<Extension> {
  let p = loaded.get(language);
  if (!p) {
    p = (LOADERS[language] ?? (async () => []))().catch((e) => {
      loaded.delete(language); // a failed chunk load can be retried
      throw e;
    });
    loaded.set(language, p);
  }
  return p;
}
