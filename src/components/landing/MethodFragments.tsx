import { Flag, Lightbulb, PenLine } from "lucide-react";

/** The three method stages, illustrated with fragments of the real product.
 *
 *  A method section that shows icons next to three verbs teaches nothing. These
 *  are the actual surfaces: the pattern chips carry the same counts the DSA page
 *  shows, the checklist is a real problem list with real difficulties, and the
 *  revise rows are the three signals we genuinely track.
 *
 *  Static by design — these are marketing illustrations, not live data. Numbers
 *  match the seeded Blind 75 so nothing here is a claim we don't ship. */

const shell = "rounded-2xl border border-border bg-surface p-4";

/** 1.0 Recognise — pattern chips with problem counts. */
export function RecogniseFragment() {
  const patterns: [string, number][] = [
    ["Two Pointers", 3], ["Sliding Window", 3], ["Binary Search", 2],
    ["Trees", 11], ["Graphs", 8], ["Dynamic Programming", 12],
    ["Heap", 3], ["Backtracking", 2], ["Trie", 3],
  ];
  return (
    <div className={shell}>
      <div className="flex flex-wrap gap-1.5">
        {patterns.map(([name, count], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] ${
              i === 0 || i === 5
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-secondary"
            }`}
          >
            {name}
            <span className="font-mono text-[10px] text-muted">{count}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted">
        Sorted array + a target pair → <span className="text-accent">Two Pointers</span>
      </p>
    </div>
  );
}

/** 2.0 Practise — a real problem checklist. */
export function PractiseFragment() {
  const rows: [string, string, boolean][] = [
    ["Container With Most Water", "Medium", true],
    ["Trapping Rain Water", "Hard", true],
    ["3Sum", "Medium", true],
    ["Sort Colors", "Medium", false],
    ["Remove Nth Node From End", "Medium", false],
  ];
  const tone: Record<string, string> = {
    Easy: "text-accent", Medium: "text-amber-400", Hard: "text-red-400",
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {rows.map(([title, diff, done], i) => (
        <div
          key={title}
          className={`flex items-center gap-3 border-border px-4 py-2.5 ${i > 0 ? "border-t" : ""} ${
            i === rows.length - 1 ? "opacity-45" : ""
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              done ? "border-accent bg-accent text-black" : "border-border"
            }`}
          >
            {done && (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 6.5 L4.6 9 L10 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-secondary">{title}</span>
          <span className={`shrink-0 font-mono text-[11px] ${tone[diff]}`}>{diff}</span>
        </div>
      ))}
      <div className="border-t border-border px-4 py-2 text-center font-mono text-[11px] text-muted">
        + 70 more
      </div>
    </div>
  );
}

/** 3.0 Revise — the three signals that bring a problem back. */
export function ReviseFragment() {
  const rows = [
    { icon: Flag,      label: "Flagged for revision", note: "you mark it" },
    { icon: Lightbulb, label: "Needed a hint",        note: "auto-tracked" },
    { icon: PenLine,   label: "Notes written",        note: "private to you" },
  ];
  return (
    <div className="space-y-2">
      {rows.map(({ icon: Icon, label, note }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="rounded-lg bg-accent/10 p-2">
            <Icon size={14} className="text-accent" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-secondary">{label}</span>
          <span className="shrink-0 font-mono text-[11px] text-muted">{note}</span>
        </div>
      ))}
    </div>
  );
}
