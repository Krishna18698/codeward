"use client";
import { useEffect, useRef, useState } from "react";
import { X, Bold, Italic, Strikethrough, Underline, List, ListOrdered, Quote, Code } from "lucide-react";

/** Bottom-sheet note editor for a problem.
 *
 *  Replaces an inline panel that was four rows tall and wedged between problems.
 *  Notes are the one place in the sheet where you actually write something, and
 *  the panel gave you less room the moment the phone keyboard came up.
 *
 *  The save behaviour matters more than the layout. Typing debounces a save by
 *  800ms; the old editor cleared that timer on unmount, so closing within 800ms
 *  of the last keystroke dropped the note with no warning. Here the pending save
 *  is FLUSHED on close and on unmount.
 */

type Cmd = {
  label: string;
  icon?: typeof Bold;
  /** Rendered instead of an icon — headings read better as text than as glyphs. */
  text?: string;
  wrap?: [string, string];
  prefix?: string;
};

/** Markdown, because that is what the note is stored and rendered as — the
 *  buttons insert syntax rather than pretending to be a rich-text engine. */
const GROUPS: Cmd[][] = [
  [
    { label: "Bold",          icon: Bold,          wrap: ["**", "**"] },
    { label: "Italic",        icon: Italic,        wrap: ["*", "*"] },
    { label: "Strikethrough", icon: Strikethrough, wrap: ["~~", "~~"] },
    { label: "Underline",     icon: Underline,     wrap: ["<u>", "</u>"] },
  ],
  [
    { label: "Heading 2", text: "H2", prefix: "## " },
    { label: "Heading 3", text: "H3", prefix: "### " },
  ],
  [
    { label: "Bullet list",   icon: List,        prefix: "- " },
    { label: "Numbered list", icon: ListOrdered, prefix: "1. " },
    { label: "Quote",         icon: Quote,       prefix: "> " },
  ],
  [
    { label: "Code block", icon: Code, wrap: ["```\n", "\n```"] },
  ],
];

/** The one place a note is written. `keepalive` lets the request outlive the
 *  component when it fires from an unmount. */
function writeNote(problemId: string, userId: string, content: string, keepalive = false) {
  return fetch("/api/notes/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId, userId, content }),
    keepalive,
  });
}

export default function NoteModal({
  problemId,
  userId,
  title,
  initialContent,
  onClose,
  onSaved,
}: {
  problemId: string;
  userId: string;
  title: string;
  initialContent: string;
  onClose: () => void;
  /** Lets the list update its "has a note" indicator without a refetch. */
  onSaved?: (content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read by the unmount cleanup, which can't see the latest render's state.
  const pendingRef = useRef<string | null>(null);

  const save = async (text: string) => {
    pendingRef.current = null;
    setState("saving");
    try {
      await writeNote(problemId, userId, text);
      onSaved?.(text);
      setState("saved");
    } catch {
      setState("idle");
    }
  };

  const queueSave = (text: string) => {
    pendingRef.current = text;
    setState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 800);
  };

  /** Write whatever is still queued. A cancelled timer here is a lost note —
   *  which is exactly what the old inline editor did on unmount. */
  const flush = (keepalive = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (pending === null) return;
    void writeNote(problemId, userId, pending, keepalive);
    onSaved?.(pending);
    pendingRef.current = null;
  };

  // Unmount is the last chance to save, so the request goes out with keepalive.
  // problemId and userId are fixed for this editor's lifetime — it is keyed to
  // one problem and unmounts when closed — so an empty dep list is correct here.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (pending !== null) {
      void writeNote(problemId, userId, pending, true);
      pendingRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { flush(); onClose(); };

  // Focus the text, and hand focus back to the opener when we're done.
  //
  // preventScroll on both: a plain focus() asks the browser to bring the element
  // into view, and it does that by scrolling the nearest scrollable ancestor —
  // the dashboard's <main>. Opening a note jumped the page from 300px to the
  // bottom of the sheet, and closing it jumped somewhere else again.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const a = areaRef.current;
    if (a) {
      a.focus({ preventScroll: true });
      a.setSelectionRange(a.value.length, a.value.length);
    }
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  /** Applies a command to the selection and keeps the caret somewhere useful. */
  const apply = (cmd: Cmd) => {
    const a = areaRef.current;
    if (!a) return;
    const { selectionStart: s, selectionEnd: e, value } = a;

    let next: string, caret: number;
    if (cmd.wrap) {
      const [open, shut] = cmd.wrap;
      next = value.slice(0, s) + open + value.slice(s, e) + shut + value.slice(e);
      caret = e === s ? s + open.length : e + open.length + shut.length;
    } else {
      // Prefix every line the selection touches, toggling it off if it's there.
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const lineEnd = value.indexOf("\n", e) === -1 ? value.length : value.indexOf("\n", e);
      const block = value.slice(lineStart, lineEnd);
      const p = cmd.prefix!;
      const has = block.split("\n").every((l) => l.startsWith(p));
      const rebuilt = block
        .split("\n")
        .map((l) => (has ? l.slice(p.length) : p + l))
        .join("\n");
      next = value.slice(0, lineStart) + rebuilt + value.slice(lineEnd);
      caret = lineStart + rebuilt.length;
    }

    setContent(next);
    queueSave(next);
    requestAnimationFrame(() => { a.focus({ preventScroll: true }); a.setSelectionRange(caret, caret); });
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Notes for ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="note-sheet flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px] border border-border sm:max-h-[85vh] sm:rounded-[22px]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-accent">Note</p>
            <h2 className="mt-1 truncate text-[22px] font-semibold tracking-heading text-primary">{title}</h2>
          </div>
          <button
            onClick={close}
            aria-label="Close notes"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-border text-secondary transition-colors hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editor — toolbar and text share one bordered well, as in the design. */}
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border">
            <div className="flex shrink-0 items-center justify-between overflow-x-auto border-b border-border px-1.5 py-1.5">
              {GROUPS.map((group, gi) => (
                <div key={gi} className="flex shrink-0 items-center">
                  {gi > 0 && <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />}
                  {group.map((cmd) => (
                    <button
                      key={cmd.label}
                      type="button"
                      onClick={() => apply(cmd)}
                      title={cmd.label}
                      aria-label={cmd.label}
                      className="grid h-8 min-w-7 shrink-0 place-items-center rounded-lg text-secondary transition-colors hover:bg-elevated hover:text-primary"
                    >
                      {cmd.text
                        ? <span className="px-0.5 text-[13px] font-semibold">{cmd.text}</span>
                        : cmd.icon && <cmd.icon size={16} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <textarea
              ref={areaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); queueSave(e.target.value); }}
              placeholder="Jot your approach, edge cases, complexity, and gotchas…"
              className="min-h-[34dvh] flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-primary placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          <span className="text-[13px] text-muted">
            {words} {words === 1 ? "word" : "words"}
            {state === "saving" && <span className="ml-2">saving…</span>}
            {state === "saved" && <span className="ml-2 text-accent">saved</span>}
          </span>
          <button
            onClick={close}
            className="rounded-full bg-accent px-7 py-2.5 text-[15px] font-semibold text-black transition-colors hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
