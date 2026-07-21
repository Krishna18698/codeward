// Tiny, dependency-free TypeScript/JavaScript highlighter for the Code Review
// pane, which renders code line-by-line with interleaved inline comments (so a
// full editor doesn't fit). Returns HTML with color spans; all source text is
// HTML-escaped first, and the input is static exercise code (never user input),
// so the resulting string is safe for dangerouslySetInnerHTML.
//
// Single-line only by design — block comments / multi-line template literals
// spanning lines aren't tracked, which is fine for these review snippets.

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "await", "async",
  "import", "export", "from", "class", "extends", "implements", "new", "try", "catch", "finally",
  "throw", "typeof", "instanceof", "interface", "type", "enum", "public", "private", "protected",
  "readonly", "static", "void", "null", "undefined", "true", "false", "this", "super", "switch",
  "case", "break", "continue", "default", "of", "in", "as", "namespace", "yield", "do", "delete",
  "abstract", "declare", "keyof", "infer", "satisfies",
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Returns an HTML string with syntax-coloring spans for one line of TS/JS. */
export function highlightTs(line: string): string {
  const re = /(\/\/.*$)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d[\d_.eExXbBoO]*\b)|([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    out += escapeHtml(line.slice(last, m.index));
    const tok = m[0];
    if (m[1]) {
      out += `<span class="text-neutral-500">${escapeHtml(tok)}</span>`; // comment
    } else if (m[2]) {
      out += `<span class="text-emerald-300">${escapeHtml(tok)}</span>`; // string
    } else if (m[3]) {
      out += `<span class="text-amber-300">${escapeHtml(tok)}</span>`; // number
    } else if (m[4]) {
      out += KEYWORDS.has(tok)
        ? `<span class="text-violet-300">${escapeHtml(tok)}</span>` // keyword
        : escapeHtml(tok);
    }
    last = m.index + tok.length;
  }
  out += escapeHtml(line.slice(last));
  return out;
}
