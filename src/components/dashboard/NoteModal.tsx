"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "@/lib/useDialog";
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

/** The one place a note is written. Resolves true only when the server says
 *  it stored the note — a 401 or 500 is a failed save, not a saved one.
 *  `keepalive` lets the request outlive the component when it fires from an
 *  unmount. */
async function writeNote(problemId: string, userId: string, content: string, keepalive = false): Promise<boolean> {
  try {
    const res = await fetch("/api/notes/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, userId, content }),
      keepalive,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** A draft that hasn't been confirmed saved is kept on this device, so a
 *  failed save — or closing anyway — never loses what was written. Reopening
 *  the note restores it and saves it again. */
const draftKey = (userId: string, problemId: string) => `codeward:note-draft:${userId}:${problemId}`;
function readDraft(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function keepDraft(key: string, text: string) {
  try { localStorage.setItem(key, text); } catch {}
}
function dropDraft(key: string) {
  try { localStorage.removeItem(key); } catch {}
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
  const dialogRef = useRef<HTMLDivElement>(null);

  // How much of the layout viewport the soft keyboard is covering, and how much
  // height is actually left to draw in.
  //
  // `interactiveWidget: resizes-content` in the root viewport handles this on
  // its own where it's supported — there the inset stays 0 and nothing below
  // does anything. This is the fallback for browsers that keep the layout
  // viewport at full height and just slide the visual one, which leaves a
  // bottom-anchored sheet sitting underneath the keyboard.
  const [kb, setKb] = useState({ inset: 0, avail: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKb({ inset, avail: vv.height });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const key = draftKey(userId, problemId);
  // A draft left by a failed save wins over the stored note: it's newer.
  const [restored] = useState(() => {
    const draft = readDraft(key);
    return draft !== null && draft !== initialContent ? draft : null;
  });
  const [content, setContent] = useState(restored ?? initialContent);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The text not yet confirmed saved. Read by the unmount cleanup, which can't
  // see the latest render's state.
  const pendingRef = useRef<string | null>(null);

  /** Saves `text`; true once the server confirms. Until then the text stays
   *  pending and on this device — the old editor marked a note saved without
   *  looking at the response, and dropped it from the queue before the
   *  request had even answered. */
  const save = async (text: string): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState("saving");
    const ok = await writeNote(problemId, userId, text);
    // Typing during the request queues newer text; only clear what we saved.
    if (pendingRef.current !== text) {
      if (ok) onSaved?.(text);
      return ok;
    }
    if (ok) {
      pendingRef.current = null;
      dropDraft(key);
      onSaved?.(text);
      setState("saved");
    } else {
      keepDraft(key, text);
      setState("failed");
    }
    return ok;
  };

  const queueSave = (text: string) => {
    pendingRef.current = text;
    setState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(text), 800);
  };

  // A restored draft was never confirmed saved: save it now.
  useEffect(() => {
    if (restored !== null) queueSave(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unmount is the last chance to save, so the request goes out with keepalive.
  // Its answer can't be read, so the draft stays on this device until a later
  // save confirms it. problemId and userId are fixed for this editor's
  // lifetime — it is keyed to one problem and unmounts when closed — so an
  // empty dep list is correct here.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (pending !== null) {
      keepDraft(draftKey(userId, problemId), pending);
      void writeNote(problemId, userId, pending, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Closing saves first and only closes once the save is confirmed; a failed
   *  save keeps the editor open with Retry. */
  const close = async () => {
    const pending = pendingRef.current;
    if (pending !== null && !(await save(pending))) return;
    onClose();
  };

  /** Leaves with the draft unconfirmed — it stays on this device and is
   *  restored, and saved again, the next time this note is opened. */
  const closeAnyway = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingRef.current !== null) keepDraft(key, pendingRef.current);
    pendingRef.current = null; // the unmount write would race the restore
    onClose();
  };

  // Focus the text, and hand focus back to the opener when we're done.
  //
  // preventScroll on both: a plain focus() asks the browser to bring the element
  // into view, and it does that by scrolling the nearest scrollable ancestor —
  // the dashboard's <main>. Opening a note jumped the page from 300px to the
  // bottom of the sheet, and closing it jumped somewhere else again.
  // (Handing focus back to the opener is useDialog's job, with the same
  // preventScroll.)
  useEffect(() => {
    const a = areaRef.current;
    if (a) {
      a.focus({ preventScroll: true });
      a.setSelectionRange(a.value.length, a.value.length);
    }
  }, []);

  // Escape, focus trap, focus return and scroll lock. Escape goes through
  // close(), so it saves first like every other way out.
  useDialog(dialogRef, { onClose: () => void close(), autoFocus: false });

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

  // Rendered into <body>, not where it sits in the tree.
  //
  // The dashboard content carries `animate-fade-up`, whose fill-mode leaves an
  // identity transform on the element. A transform — even matrix(1,0,0,1,0,0) —
  // makes that element the containing block for position:fixed descendants, so
  // `inset-0` sized this overlay to the 6413px scroll content instead of the
  // viewport and put the sheet about 5000px below the screen. A portal puts it
  // out of reach of any ancestor's transform, filter or containment.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4"
      style={kb.inset > 0 ? { paddingBottom: kb.inset } : undefined}
      onClick={close}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Notes for ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="note-sheet flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px] border border-border sm:max-h-[85vh] sm:rounded-[22px]"
        // With the keyboard up there is far less room than 88dvh, and the
        // footer is the first thing to fall off the bottom — which is exactly
        // the Done button.
        style={kb.inset > 0 ? { maxHeight: Math.round(kb.avail * 0.94) } : undefined}
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
              // The min-height gives the editor presence when there's room, but
              // it must not hold the sheet taller than the visible area once the
              // keyboard is up.
              className={kb.inset > 0
                ? "min-h-0 flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-primary placeholder:text-muted focus:outline-none"
                : "min-h-[34dvh] flex-1 resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-primary placeholder:text-muted focus:outline-none"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          <span className="min-w-0 text-[13px] text-muted" aria-live="polite">
            {state === "failed" ? (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-rose-400">Not saved — your draft is kept on this device.</span>
                <button type="button" onClick={() => void save(pendingRef.current ?? content)} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Retry
                </button>
                <button type="button" onClick={closeAnyway} className="text-muted underline-offset-2 hover:text-secondary hover:underline">
                  Close anyway
                </button>
              </span>
            ) : (
              <>
                {words} {words === 1 ? "word" : "words"}
                {state === "saving" && <span className="ml-2">saving…</span>}
                {state === "saved" && <span className="ml-2 text-accent">saved</span>}
              </>
            )}
          </span>
          <button
            onClick={() => void close()}
            className="rounded-full bg-accent px-7 py-2.5 text-[15px] font-semibold text-black transition-colors hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
    ,
    document.body,
  );
}
