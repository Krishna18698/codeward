"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronRight, Check, Circle, StickyNote, X, Flag, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { LeetCodeIcon } from "@/components/ui/LeetCodeIcon";
import { GFGIcon } from "@/components/ui/GFGIcon";
import type { Difficulty, ProblemPattern, ProblemStatus } from "@prisma/client";
import { PATTERNS, TOPICS, PRIMARY_LABEL, patternLabel } from "@/content/patterns";

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
  onStatusChange?: (prev: ProblemStatus, next: ProblemStatus, difficulty: Difficulty) => void;
  onAddProblems?: () => void;
  /** Last-Minute view: only the must-do problems of this sheet. */
  mustDoOnly?: boolean;
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
  EASY: "text-accent",
  MEDIUM: "text-amber-400",
  HARD: "text-red-400",
};


const statusTitle: Record<ProblemStatus, string> = {
  TODO: "Mark as Done",
  SOLVING: "Mark as Done",
  DONE: "Mark as To Do",
};

function StatusIcon({ status }: { status: ProblemStatus }) {
  if (status === "DONE")
    return <Check size={12} strokeWidth={2.5} className="text-accent" />;
  if (status === "SOLVING")
    return <Circle size={12} strokeWidth={2.5} className="text-amber-400" fill="rgba(251, 191, 36, 0.3)" />;
  return <Circle size={12} strokeWidth={1.5} className="text-muted" />;
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
    <div className="px-4 pb-3 bg-surface">
      <div className="rounded-lg border border-border bg-canvas overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
          <span className="text-[11px] text-muted flex items-center gap-1.5">
            <StickyNote size={11} />
            Notes
          </span>
          <div className="flex items-center gap-3">
            {saveState === "saving" && <span className="text-[10px] text-muted">saving…</span>}
            {saveState === "saved"  && <span className="text-[10px] text-accent">saved ✓</span>}
            <button onClick={onClose} className="text-muted hover:text-secondary transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Add your notes, key insights, approach…"
          className="w-full bg-transparent text-secondary text-xs px-3 py-2.5 resize-none focus:outline-none placeholder:text-muted"
          rows={4}
          autoFocus
        />
      </div>
    </div>
  );
}

export default function ProblemList({
  grouped, userId, sheetId, initialNotes, onStatusChange, onAddProblems, mustDoOnly = false,
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
  // Which problem is mid-celebration. The status button is the SAME DOM node
  // across re-renders, so a permanently-applied class would only ever animate
  // once — the class has to be absent for a frame before it can replay. Clearing
  // this in onAnimationEnd gives us that.
  const [poppingId, setPoppingId] = useState<string | null>(null);
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
        setAllProblems(mustDoOnly ? fresh.filter((p) => p.mustDo) : fresh);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [diffFilter, compFilter, sheetId, mustDoOnly]);


  const toggleDone = async (problemId: string) => {
    const current = statuses[problemId] ?? "TODO";
    const next: ProblemStatus = current === "DONE" ? "TODO" : "DONE";
    const difficulty = allProblems.find((p) => p.id === problemId)?.difficulty ?? "EASY";
    setStatuses((prev) => ({ ...prev, [problemId]: next }));
    onStatusChange?.(current, next, difficulty);
    // Celebrate solving, never un-solving.
    if (next === "DONE") setPoppingId(problemId);
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
      onStatusChange?.(next, current, difficulty);
      setPoppingId((id) => (id === problemId ? null : id));
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

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems…"
          className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-secondary placeholder:text-muted focus:outline-none focus:border-border transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-secondary focus:outline-none focus:border-border transition-colors"
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
            className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-secondary focus:outline-none focus:border-border transition-colors"
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
            className="flex items-center gap-1 text-xs text-muted hover:text-secondary border border-border rounded-xl px-2.5 py-1.5 transition-colors"
          >
            <X size={10} /> Clear
          </button>
        )}
        {onAddProblems && (
          <button
            onClick={onAddProblems}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs text-accent/80 hover:text-accent-hover hover:border-accent/50 hover:bg-accent/10 transition-all"
          >
            <span className="text-sm leading-none">＋</span> Add Problems
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">By topic</h3>
      </div>

      {/* Two levels: topic, then the patterns inside it. Sixteen flat pattern
          cards gave no sense of shape — two-pointer and sliding-window are
          array techniques, not siblings of "graphs". */}
      {TOPICS.map((topic) => {
        const topicPatterns = topic.patterns.filter((p) => filteredGrouped[p]?.length);
        if (topicPatterns.length === 0) return null;

        const topicProblems = topicPatterns.flatMap((p) => filteredGrouped[p]);
        const topicDone = topicProblems.filter((p) => statuses[p.id] === "DONE").length;

        return (
          <section key={topic.key} className="pt-8 first:pt-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-heading text-primary">{topic.label}</h3>
              <span className="shrink-0 text-xs text-muted">
                {topicProblems.length} problem{topicProblems.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Bar sits left with the fraction beside it, not stretched across
                the row — the number is what you read, the bar is the glance. */}
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-border">
                <div
                  className="h-full w-full origin-left rounded-full bg-accent-fill transition-transform duration-700"
                  style={{ transform: `scaleX(${topicProblems.length ? topicDone / topicProblems.length : 0})` }}
                />
              </div>
              <span className="shrink-0 text-xs text-muted">{topicDone} / {topicProblems.length}</span>
            </div>

            <p className="mt-2.5 text-sm text-secondary">{topic.blurb}</p>

            <div className="mt-4 space-y-2.5">
      {topicPatterns.map((pattern) => {
        const problems = filteredGrouped[pattern];
        const groupDone = problems.filter((p) => statuses[p.id] === "DONE").length;
        const isCollapsed = collapsed[pattern] !== false;

        return (
          <div key={pattern} className="rounded-xl border border-border bg-surface overflow-hidden">
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [pattern]: prev[pattern] === false }))}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated"
            >
              {/* Chevron in its own tile on the left — the affordance reads as a
                  control rather than a stray glyph at the end of the row. */}
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isCollapsed
                    ? "border-border text-muted"
                    : "border-accent/40 bg-accent/10 text-accent",
                )}
              >
                <ChevronRight
                  size={15}
                  className={cn("transition-transform duration-200", !isCollapsed && "rotate-90")}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold capitalize text-primary">
                  {pattern === topic.primary ? PRIMARY_LABEL : patternLabel(pattern)}
                </span>
                {/* The cue only. The definitional description said what the
                    pattern IS; the cue says how to spot it, which is the whole
                    point of filing problems this way. */}
                {PATTERNS[pattern]?.cue && (
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                    {PATTERNS[pattern].cue}
                  </span>
                )}
              </span>

              <span
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] tabular-nums",
                  groupDone === problems.length
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-muted",
                )}
              >
                {groupDone}/{problems.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-border">
                {problems.map((p, idx) => {
                  const status = statuses[p.id] ?? "TODO";
                  const noteOpen = openNoteId === p.id;
                  const hasNote = !!(notes[p.id]?.trim());
                  const isRevising = revising[p.id] ?? false;
                  const animDelay = `${idx * 20}ms`;

                  return (
                    <div key={p.id} className="animate-fade-in" style={{ animationDelay: animDelay }}>
                      {/* Problem row */}
                      <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-border transition-colors">
                        {/* Status circle — self-center so it stays centered across both lines */}
                        <button
                          onClick={() => toggleDone(p.id)}
                          title={statusTitle[status]}
                          onAnimationEnd={() => setPoppingId((id) => (id === p.id ? null : id))}
                          className={cn(
                            "shrink-0 self-center w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-150",
                            status === "DONE"    && "border-accent/60 bg-accent/10",
                            status === "SOLVING" && "border-amber-500/60 bg-amber-500/10",
                            status === "TODO"    && "border-border hover:border-border",
                            poppingId === p.id && "animate-solve-pop",
                          )}
                        >
                          <StatusIcon status={status} />
                        </button>

                        {/* Content: 2-line on mobile, 1-line on desktop */}
                        <div className="flex-1 min-w-0">

                          {/* ── Mobile: 2-line ── */}
                          <div className="md:hidden space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm text-secondary leading-snug">{p.title}</span>
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
                                <button onClick={() => toggleRevise(p.id)} title={isRevising ? "Remove from revision list" : "Mark for revision"} className={cn("p-1.5 rounded transition-colors", isRevising ? "text-rose-400 hover:text-rose-300" : "text-muted hover:text-secondary")}>
                                  <Flag size={15} className={isRevising ? "fill-current" : ""} />
                                </button>
                                <button onClick={() => toggleNote(p.id)} title={noteOpen ? "Close notes" : "Open notes"} className={cn("p-1.5 rounded transition-colors", noteOpen || hasNote ? "text-amber-400/80 hover:text-amber-400" : "text-muted hover:text-secondary")}>
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
                            <span className="text-sm text-secondary leading-snug min-w-0 truncate">{p.title}</span>

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
                              <button onClick={() => toggleRevise(p.id)} title={isRevising ? "Remove from revision list" : "Mark for revision"} className={cn("p-2 rounded transition-colors", isRevising ? "text-rose-400 hover:text-rose-300" : "text-muted hover:text-secondary")}>
                                <Flag size={15} className={isRevising ? "fill-current" : ""} />
                              </button>
                              <button onClick={() => toggleNote(p.id)} title={noteOpen ? "Close notes" : "Open notes"} className={cn("p-2 rounded transition-colors", noteOpen || hasNote ? "text-amber-400/80 hover:text-amber-400" : "text-muted hover:text-secondary")}>
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
          </section>
        );
      })}

    </div>
  );
}
