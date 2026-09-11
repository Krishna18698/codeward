"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Bold, Italic, Strikethrough, Underline, List, ListOrdered, Quote, Code } from "lucide-react";
import { cn } from "@/lib/cn";

/** Full-screen note editor for a problem.
 *
 *  Replaces an inline panel that was four rows tall and wedged between problems.
 *  Notes are the one place in the sheet where you actually write something, and
 *  the panel gave you less room the moment the phone keyboard came up.
 *
 *  The save behaviour matters more than the layout. Typing debounces a save by
 *  800ms; the old editor cleared that timer on unmount, so closing within 800ms
 *  of the last keystroke dropped the note with no warning. Here the pending save
 *  is FLUSHED on close and on unmount, and Done waits for it to land.
 */

type Cmd = { icon: typeof Bold; label: string; wrap?: [string, string]; prefix?: string };

/** Markdown, because that is what the note is stored and rendered as — the
 *  buttons insert syntax rather than pretending to be a rich-text engine. */
const INLINE: Cmd[] = [
  { icon: Bold,          label: "Bold",          wrap: ["**", "**"] },
  { icon: Italic,        label: "Italic",        wrap: ["*", "*"] },
  { icon: Strikethrough, label: "Strikethrough", wrap: ["~~", "~~"] },
  { icon: Underline,     label: "Underline",     wrap: ["<u>", "</u>"] },
];
const BLOCK: Cmd[] = [
  { icon: List,        label: "Bullet list",    prefix: "- " },
  { icon: ListOrdered, label: "Numbered list",  prefix: "1. " },
  { icon: Quote,       label: "Quote",          prefix: "> " },
  { icon: Code,        label: "Code block",     wrap: ["```\n", "\n```"] },
];

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

  const save = useCallback(async (text: string) => {
    pendingRef.current = null;
    setState("saving");
    try {
      await fetch("/api/notes/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, userId, content: text }),
      });
      onSaved?.(text);
      setState("saved");
    } catch {
      setState("idle");
    }
  }, [problemId, userId, onSaved]);

  const queueSave = (text: string) => {
    pendingRef.current = text;
    setState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 800);
  };

  /** Write whatever is still queued. Called on close, and on unmount — a
   *  cancelled timer here is a lost note. */
  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (pending !== null) {
      // keepalive so the request survives the component going away.
      void fetch("/api/notes/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, userId, content: pending }),
        keepalive: true,
      });
      onSaved?.(pending);
      pendingRef.current = null;
    }
  }, [problemId, userId, onSaved]);

  useEffect(() => flush, [flush]);

  const close = () => { flush(); onClose(); };

  // Focus the text, and hand focus back to the opener when we're done.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const a = areaRef.current;
    if (a) { a.focus(); a.setSelectionRange(a.value.length, a.value.length); }
    return () => opener?.focus?.();
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
    requestAnimationFrame(() => { a.focus(); a.setSelectionRange(caret, caret); });
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const ToolBtn = ({ cmd }: { cmd: Cmd }) => (
    <button
      type="button"
      onClick={() => apply(cmd)}
      title={cmd.label}
      aria-label={cmd.label}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-secondary transition-colors hover:bg-elevated hover:text-primary"
    >
      <cmd.icon size={15} />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-canvas/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Notes for ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface sm:max-h-[85vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Note</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-primary">{title}</h2>
          </div>
          <button
            onClick={close}
            aria-label="Close notes"
            className="shrink-0 rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-elevated hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar — scrolls sideways on a narrow phone rather than wrapping. */}
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3 py-1.5">
          {INLINE.map((c) => <ToolBtn key={c.label} cmd={c} />)}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          {BLOCK.map((c) => <ToolBtn key={c.label} cmd={c} />)}
        </div>

        {/* Editor */}
        <textarea
          ref={areaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); queueSave(e.target.value); }}
          placeholder="Jot your approach, edge cases, complexity, and gotchas…"
          className="min-h-[40dvh] flex-1 resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-secondary placeholder:text-muted focus:outline-none"
        />

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="font-mono text-[11px] text-muted">
            {words} {words === 1 ? "word" : "words"}
            {state === "saving" && <span className="ml-2">saving…</span>}
            {state === "saved" && <span className="ml-2 text-accent">saved</span>}
          </span>
          <button
            onClick={close}
            className={cn(
              "rounded-xl bg-accent-fill px-5 py-2 text-sm font-semibold text-black transition-colors",
              "hover:bg-accent-hover",
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
