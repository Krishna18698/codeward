"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronRight, Check, Circle, StickyNote, X, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { LeetCodeIcon } from "@/components/ui/LeetCodeIcon";
import { GFGIcon } from "@/components/ui/GFGIcon";
import type { Difficulty, ProblemPattern, ProblemStatus } from "@prisma/client";

type ProblemWithStatus = {
  id: string;
  title: string;
  difficulty: Difficulty;
  pattern: ProblemPattern;
  mustDo: boolean;
  leetcodeUrl: string | null;
  gfgUrl: string | null;
  companies: string[];
  statuses: { status: ProblemStatus; toRevise: boolean }[];
  [key: string]: unknown;
};

type Props = {
  grouped: Record<string, ProblemWithStatus[]>;
  userId: string;
  sheetId: string;
  initialNotes: Record<string, string>;
  onStatusChange?: (prev: ProblemStatus, next: ProblemStatus) => void;
  onAddProblems?: () => void;
};

const COMPANY_DOMAINS: Record<string, string> = {
  Google: "google.com",
  Amazon: "amazon.com",
  Meta: "meta.com",
  Microsoft: "microsoft.com",
  Apple: "apple.com",
  "Goldman Sachs": "goldmansachs.com",
  LinkedIn: "linkedin.com",
  Netflix: "netflix.com",
  Uber: "uber.com",
  Airbnb: "airbnb.com",
  Adobe: "adobe.com",
  Twitter: "x.com",
  Flipkart: "flipkart.com",
  Swiggy: "swiggy.com",
  "Morgan Stanley": "morganstanley.com",
  Facebook: "facebook.com",
};

const difficultyColor: Record<Difficulty, string> = {
  EASY: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD: "text-red-400",
};

const PATTERN_DESCRIPTIONS: Partial<Record<string, string>> = {
  ARRAYS:               "Fundamental collection of elements stored at contiguous memory locations.",
  STRINGS:              "Sequence of characters with pattern matching and manipulation techniques.",
  LINKED_LIST:          "Sequential node chain where each node points to the next in memory.",
  TREES:                "Hierarchical structures with parent-child relationships and recursive traversals.",
  GRAPHS:               "Networks of vertices and edges solved with BFS, DFS, union-find, and shortest paths.",
  DYNAMIC_PROGRAMMING:  "Break problems into overlapping subproblems and cache results to avoid recomputation.",
  BACKTRACKING:         "Explore all possibilities by building candidates and abandoning those that fail constraints.",
  BINARY_SEARCH:        "Eliminate half the search space each step by comparing against a sorted midpoint.",
  SLIDING_WINDOW:       "Maintain a window over a sequence and expand or shrink it to satisfy a condition.",
  TWO_POINTERS:         "Use two indices moving towards or away from each other to cut redundant comparisons.",
  STACK_QUEUE:          "LIFO and FIFO structures for state tracking, parsing, and monotonic sequences.",
  HEAP:                 "Priority queue built on a complete binary tree for efficient min/max extraction.",
  TRIE:                 "Prefix tree enabling fast string search, autocomplete, and dictionary operations.",
  MATH:                 "Number theory and combinatorics to derive O(1) or O(√n) solutions.",
  BIT_MANIPULATION:     "Use bitwise operators to solve problems with constant space and fast bit tricks.",
  OTHER:                "Problems that combine multiple patterns or require unique problem-specific approaches.",
};

// Patterns ordered by interview importance / learning progression — most important first.
const PATTERN_ORDER = [
  "ARRAYS", "STRINGS", "TWO_POINTERS", "SLIDING_WINDOW", "BINARY_SEARCH",
  "LINKED_LIST", "STACK_QUEUE", "TREES", "GRAPHS", "HEAP",
  "DYNAMIC_PROGRAMMING", "BACKTRACKING", "TRIE", "BIT_MANIPULATION", "MATH", "OTHER",
];
const patternRank = (p: string) => {
  const i = PATTERN_ORDER.indexOf(p);
  return i === -1 ? PATTERN_ORDER.length : i;
};

const statusTitle: Record<ProblemStatus, string> = {
  TODO: "Mark as Done",
  SOLVING: "Mark as Done",
  DONE: "Mark as To Do",
};

function StatusIcon({ status }: { status: ProblemStatus }) {
  if (status === "DONE")
    return <Check size={12} strokeWidth={2.5} className="text-emerald-400" />;
  if (status === "SOLVING")
    return <Circle size={12} strokeWidth={2.5} className="text-emerald-400" fill="rgba(52, 211, 153,0.3)" />;
  return <Circle size={12} strokeWidth={1.5} className="text-neutral-500" />;
}

function InlineNote({
  problemId,
  userId,
  initialContent,
  onClose,
}: {
  problemId: string;
  userId: string;
  initialContent: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (text: string) => {
    setSaveState("saving");
    await fetch("/api/notes/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, userId, content: text }),
    });
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [problemId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(val), 800);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="px-4 pb-3 bg-neutral-900/80">
      <div className="rounded-lg border border-neutral-700/60 bg-canvas overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <StickyNote size={11} />
            Notes
          </span>
          <div className="flex items-center gap-3">
            {saveState === "saving" && <span className="text-[10px] text-neutral-500">saving…</span>}
            {saveState === "saved"  && <span className="text-[10px] text-emerald-500">saved ✓</span>}
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-400 transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Add your notes, key insights, approach…"
          className="w-full bg-transparent text-neutral-300 text-xs px-3 py-2.5 resize-none focus:outline-none placeholder:text-neutral-500"
          rows={4}
          autoFocus
        />
      </div>
    </div>
  );
}

export default function ProblemList({
  grouped, userId, sheetId, initialNotes, onStatusChange, onAddProblems,
}: Props) {
  const [allProblems, setAllProblems] = useState<ProblemWithStatus[]>(() =>
    Object.values(grouped).flat()
  );

  const liveGrouped = allProblems.reduce<Record<string, ProblemWithStatus[]>>((acc, p) => {
    if (!acc[p.pattern]) acc[p.pattern] = [];
    acc[p.pattern].push(p);
    return acc;
  }, {});

  const [statuses, setStatuses] = useState<Record<string, ProblemStatus>>(() => {
    const map: Record<string, ProblemStatus> = {};
    for (const p of Object.values(grouped).flat()) {
      map[p.id] = p.statuses[0]?.status ?? "TODO";
    }
    return map;
  });

  const [revising, setRevising] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of Object.values(grouped).flat()) {
      map[p.id] = p.statuses[0]?.toRevise ?? false;
    }
    return map;
  });

  const notes = initialNotes;
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [diffFilter, setDiffFilter] = useState("ALL");
  const [compFilter, setCompFilter] = useState("ALL");
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const isFirstFilterRender = useRef(true);

  // Fetch distinct companies for this sheet
  useEffect(() => {
    fetch(`/api/dsa/sheet-companies?sheetId=${sheetId}`)
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json() as { companies?: string[] };
        setAvailableCompanies(d.companies ?? []);
      })
      .catch(() => {});
  }, [sheetId]);

  // Refetch when filters change (keep the current list visible until the new one arrives)
  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return; }
    let cancelled = false;
    const params = new URLSearchParams({ sheetId, skip: "0", take: "1000" });
    if (diffFilter !== "ALL") params.set("difficulty", diffFilter);
    if (compFilter !== "ALL") params.set("company", compFilter);
    fetch(`/api/dsa/problems?${params}`)
      .then(async (r) => {
        if (!r.ok || cancelled) return;
        const data = await r.json() as { problems: ProblemWithStatus[]; filteredTotal: number };
        const fresh = data.problems ?? [];
        if (cancelled) return;
        setStatuses(() => {
          const m: Record<string, ProblemStatus> = {};
          for (const p of fresh) m[p.id] = p.statuses[0]?.status ?? "TODO";
          return m;
        });
        setRevising(() => {
          const m: Record<string, boolean> = {};
          for (const p of fresh) m[p.id] = p.statuses[0]?.toRevise ?? false;
          return m;
        });
        setAllProblems(fresh);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [diffFilter, compFilter, sheetId]);


  const toggleDone = async (problemId: string) => {
    const current = statuses[problemId] ?? "TODO";
    const next: ProblemStatus = current === "DONE" ? "TODO" : "DONE";
    setStatuses((prev) => ({ ...prev, [problemId]: next }));
    onStatusChange?.(current, next);
    try {
      const res = await fetch("/api/dsa/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, status: next, userId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert the optimistic update so the UI never lies about saved state
      setStatuses((prev) => ({ ...prev, [problemId]: current }));
      onStatusChange?.(next, current);
      toast.error("Couldn't save — status reverted.");
    }
  };

  const toggleNote = (problemId: string) => {
    setOpenNoteId((prev) => (prev === problemId ? null : problemId));
  };

  const toggleRevise = async (problemId: string) => {
    const current = revising[problemId] ?? false;
    const next = !current;
    setRevising((prev) => ({ ...prev, [problemId]: next }));
    try {
      const res = await fetch("/api/dsa/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, toRevise: next, userId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRevising((prev) => ({ ...prev, [problemId]: current }));
      toast.error("Couldn't save — revise flag reverted.");
    }
  };


  const filteredGrouped: Record<string, ProblemWithStatus[]> = query.trim()
    ? Object.fromEntries(
        (Object.entries(liveGrouped) as [string, ProblemWithStatus[]][])
          .map(([k, v]): [string, ProblemWithStatus[]] => [k, v.filter((p: ProblemWithStatus) => p.title.toLowerCase().includes(query.toLowerCase()))])
          .filter(([, v]: [string, ProblemWithStatus[]]) => v.length > 0)
      )
    : liveGrouped;

  const patterns = Object.keys(filteredGrouped).sort((a, b) => patternRank(a) - patternRank(b));

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems…"
          className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-sm text-neutral-300 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition-colors"
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        {availableCompanies.length > 0 && (
          <select
            value={compFilter}
            onChange={(e) => setCompFilter(e.target.value)}
            className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition-colors"
          >
            <option value="ALL">All companies</option>
            {availableCompanies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        {(diffFilter !== "ALL" || compFilter !== "ALL") && (
          <button
            onClick={() => { setDiffFilter("ALL"); setCompFilter("ALL"); }}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-800 rounded-xl px-2.5 py-1.5 transition-colors"
          >
            <X size={10} /> Clear
          </button>
        )}
        {onAddProblems && (
          <button
            onClick={onAddProblems}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all"
          >
            <span className="text-sm leading-none">＋</span> Add Problems
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pattern Distribution</h3>
      </div>

      {patterns.map((pattern) => {
        const problems = filteredGrouped[pattern];
        const groupDone = problems.filter((p) => statuses[p.id] === "DONE").length;
        const isCollapsed = collapsed[pattern] !== false;

        return (
          <div key={pattern} className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [pattern]: prev[pattern] === false }))}
              aria-expanded={!isCollapsed}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-300 capitalize font-medium">
                    {pattern.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="text-[10px] text-neutral-500">{groupDone}/{problems.length}</span>
                </div>
                {PATTERN_DESCRIPTIONS[pattern] && (
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {PATTERN_DESCRIPTIONS[pattern]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.round((groupDone / problems.length) * 100)}%` }}
                  />
                </div>
                <ChevronRight
                  size={14}
                  className={cn(
                    "text-neutral-500 transition-transform duration-200",
                    !isCollapsed && "rotate-90",
                  )}
                />
              </div>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-neutral-800/60">
                {problems.map((p, idx) => {
                  const status = statuses[p.id] ?? "TODO";
                  const noteOpen = openNoteId === p.id;
                  const hasNote = !!(notes[p.id]?.trim());
                  const isRevising = revising[p.id] ?? false;
                  const animDelay = `${idx * 20}ms`;

                  return (
                    <div key={p.id} className="animate-fade-in" style={{ animationDelay: animDelay }}>
                      {/* Problem row */}
                      <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-neutral-800/30 transition-colors">
                        {/* Status circle — self-center so it stays centered across both lines */}
                        <button
                          onClick={() => toggleDone(p.id)}
                          title={statusTitle[status]}
                          className={cn(
                            "shrink-0 self-center w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-150",
                            status === "DONE"    && "border-emerald-500/60 bg-emerald-500/10",
                            status === "SOLVING" && "border-emerald-500/60 bg-emerald-500/10",
                            status === "TODO"    && "border-neutral-700 hover:border-neutral-500",
                          )}
                        >
                          <StatusIcon status={status} />
                        </button>

                        {/* Content: 2-line on mobile, 1-line on desktop */}
                        <div className="flex-1 min-w-0">

                          {/* ── Mobile: 2-line ── */}
                          <div className="md:hidden space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm text-neutral-300 leading-snug">{p.title}</span>
                              {p.mustDo && (
                                <span className="shrink-0 text-[10px] text-amber-400/80 border border-amber-500/20 rounded px-1 py-0.5 mt-0.5">must do</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center gap-1 mr-2">
                                {p.companies.slice(0, 3).map((c) => {
                                  const domain = COMPANY_DOMAINS[c];
                                  return domain ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={c} loading="lazy" decoding="async" src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={c} title={c} width={15} height={15} className="rounded-sm opacity-70 hover:opacity-100 transition-opacity" />
                                  ) : null;
                                })}
                              </div>
                              <span className={cn("text-xs font-medium shrink-0", difficultyColor[p.difficulty])}>
                                {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                              </span>
                              <div className="flex-1 flex items-center justify-end gap-0.5">
                                {p.leetcodeUrl && (
                                  <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" title="Solve on LeetCode" className="p-1.5 rounded opacity-70 hover:opacity-100 transition-opacity">
                                    <LeetCodeIcon size={20} />
                                  </a>
                                )}
                                {p.gfgUrl && (
                                  <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" title="Solve on GeeksForGeeks" className="p-1.5 rounded opacity-70 hover:opacity-100 transition-opacity">
                                    <GFGIcon size={20} />
                                  </a>
                                )}
                                <button onClick={() => toggleRevise(p.id)} title={isRevising ? "Remove from revision list" : "Mark for revision"} className={cn("p-1.5 rounded transition-colors", isRevising ? "text-rose-400 hover:text-rose-300" : "text-neutral-500 hover:text-neutral-400")}>
                                  <RotateCcw size={15} />
                                </button>
                                <button onClick={() => toggleNote(p.id)} title={noteOpen ? "Close notes" : "Open notes"} className={cn("p-1.5 rounded transition-colors", noteOpen || hasNote ? "text-amber-400/80 hover:text-amber-400" : "text-neutral-500 hover:text-neutral-400")}>
                                  <StickyNote size={15} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ── Desktop: 5-column — title | companies | must-do | difficulty | links */}
                          <div
                            className="hidden md:grid items-center gap-x-4"
                            style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,100px) 72px 72px minmax(0,1fr)" }}
                          >
                            <span className="text-sm text-neutral-300 leading-snug min-w-0 truncate">{p.title}</span>

                            {/* Companies */}
                            <div className="flex items-center justify-center gap-1.5">
                              {p.companies.slice(0, 3).map((c) => {
                                const domain = COMPANY_DOMAINS[c];
                                return domain ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={c} loading="lazy" decoding="async" src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={c} title={c} width={16} height={16} className="rounded-sm opacity-75 hover:opacity-100 transition-opacity" />
                                ) : null;
                              })}
                            </div>

                            {/* Must do */}
                            <div className="flex items-center justify-center">
                              {p.mustDo && (
                                <span className="text-[10px] text-amber-400/80 border border-amber-500/20 rounded px-1.5 py-0.5">must do</span>
                              )}
                            </div>

                            {/* Difficulty */}
                            <div className="flex items-center justify-center">
                              <span className={cn("text-xs font-medium", difficultyColor[p.difficulty])}>
                                {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                              </span>
                            </div>

                            {/* Links */}
                            <div className="flex items-center justify-end gap-1">
                              {p.leetcodeUrl && (
                                <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" title="Solve on LeetCode" className="p-2 rounded opacity-70 hover:opacity-100 transition-opacity">
                                  <LeetCodeIcon size={20} />
                                </a>
                              )}
                              {p.gfgUrl && (
                                <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" title="Solve on GeeksForGeeks" className="p-2 rounded opacity-70 hover:opacity-100 transition-opacity">
                                  <GFGIcon size={20} />
                                </a>
                              )}
                              <button onClick={() => toggleRevise(p.id)} title={isRevising ? "Remove from revision list" : "Mark for revision"} className={cn("p-2 rounded transition-colors", isRevising ? "text-rose-400 hover:text-rose-300" : "text-neutral-500 hover:text-neutral-400")}>
                                <RotateCcw size={15} />
                              </button>
                              <button onClick={() => toggleNote(p.id)} title={noteOpen ? "Close notes" : "Open notes"} className={cn("p-2 rounded transition-colors", noteOpen || hasNote ? "text-amber-400/80 hover:text-amber-400" : "text-neutral-500 hover:text-neutral-400")}>
                                <StickyNote size={15} />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Inline notes panel */}
                      {noteOpen && (
                        <InlineNote
                          problemId={p.id}
                          userId={userId}
                          initialContent={notes[p.id] ?? ""}
                          onClose={() => {
                            setOpenNoteId(null);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}
