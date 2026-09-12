"use client";
import { useState, useEffect } from "react";
import { ChevronRight, Check, Circle, PenLine, X, Flag, Search, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { LeetCodeIcon } from "@/components/ui/LeetCodeIcon";
import { GFGIcon } from "@/components/ui/GFGIcon";
import type { Difficulty, ProblemPattern, ProblemStatus } from "@prisma/client";
import { PATTERNS, TOPICS, patternLabel, unmappedPatterns } from "@/content/patterns";
import Collapse from "@/components/ui/Collapse";
import NoteModal from "@/components/dashboard/NoteModal";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

type ProblemWithStatus = {
  id: string;
  title: string;
  difficulty: Difficulty;
  pattern: ProblemPattern;
  mustDo: boolean;
  leetcodeUrl: string | null;
  gfgUrl: string | null;
  companies: string[];
  hint: string | null;
  statuses: { status: ProblemStatus; toRevise: boolean; usedHint: boolean }[];
  [key: string]: unknown;
};

type Props = {
  grouped: Record<string, ProblemWithStatus[]>;
  userId: string;
  sheetId: string;
  initialNotes: Record<string, string>;
  onStatusChange?: (prev: ProblemStatus, next: ProblemStatus, difficulty: Difficulty) => void;
  onAddProblems?: () => void;
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

export default function ProblemList({
  grouped, userId, sheetId, initialNotes, onStatusChange, onAddProblems,
}: Props) {
  // Derived, not state: the sheet's rows come from the prop and nothing mutates
  // the list itself any more (status/revise/hint live in their own maps).
  const allProblems: ProblemWithStatus[] = Object.values(grouped).flat();

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

  // State, not a straight alias for the prop: saving a note has to light up the
  // row's pencil immediately, and the prop only changes on a sheet reload.
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  // Which problem's hint is revealed (one at a time). Hint text is plain and
  // cheap, so unlike the note editor it can stay mounted inside Collapse — no
  // lag/unmount dance needed.
  const [openHintId, setOpenHintId] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of Object.values(grouped).flat()) {
      map[p.id] = p.statuses[0]?.usedHint ?? false;
    }
    return map;
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Groups start collapsed, and Collapse keeps its children mounted so it has
  // something to animate closed — which meant every row of every group was in
  // the DOM at page load. Rows are now built the first time a group is opened
  // and kept from then on, so the close animation still has content to run on.
  const [everOpened, setEverOpened] = useState<Set<string>>(() => new Set());
  // Which problem is mid-celebration. The status button is the SAME DOM node
  // across re-renders, so a permanently-applied class would only ever animate
  // once — the class has to be absent for a frame before it can replay. Clearing
  // this in onAnimationEnd gives us that.
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [diffFilter, setDiffFilter] = useState("ALL");
  const [compFilter, setCompFilter] = useState("ALL");
  const [reviseOnly, setReviseOnly] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

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

  // The modal restores focus to whatever opened it, so there's no focus dance
  // left to do here.
  const toggleNote = (problemId: string) =>
    setOpenNoteId((cur) => (cur === problemId ? null : problemId));

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


  const toggleHint = (problemId: string) => {
    if (openHintId === problemId) { setOpenHintId(null); return; }
    setOpenHintId(problemId);
    // Revealing a hint is the "needed a hint" signal — auto-tracked, write-once.
    // Fire-and-forget: the flag is advisory, so a failed write just isn't
    // recorded; no error toast, no optimistic revert.
    if (!usedHint[problemId]) {
      setUsedHint((prev) => ({ ...prev, [problemId]: true }));
      fetch("/api/dsa/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      }).catch(() => {});
    }
  };

  const flaggedCount = allProblems.filter((p) => revising[p.id]).length;
  // Derived rather than stored: unflagging the last problem while the filter is
  // on would otherwise hide the chip and leave the list filtered to nothing,
  // with no control left to switch it back off.
  const showReviseOnly = reviseOnly && flaggedCount > 0;

  const hasFilters =
    query.trim() !== "" || diffFilter !== "ALL" || compFilter !== "ALL" || showReviseOnly;
  const clearFilters = () => {
    setQuery(""); setDiffFilter("ALL"); setCompFilter("ALL"); setReviseOnly(false);
  };

  // All three filters run in memory. The difficulty and company dropdowns used
  // to refetch the whole sheet (take=1000) on every change, even though the
  // sheet is already loaded and search had always filtered locally. Filtering
  // here makes the dropdowns instant and keeps local status/revise/hint state
  // authoritative instead of being clobbered by a fresh server payload.
  const matches = (p: ProblemWithStatus) =>
    (!query.trim() || p.title.toLowerCase().includes(query.toLowerCase())) &&
    (diffFilter === "ALL" || p.difficulty === diffFilter) &&
    (compFilter === "ALL" || p.companies.includes(compFilter)) &&
    (!showReviseOnly || !!revising[p.id]);

  const filteredGrouped: Record<string, ProblemWithStatus[]> = hasFilters
    ? Object.fromEntries(
        (Object.entries(liveGrouped) as [string, ProblemWithStatus[]][])
          .map(([k, v]): [string, ProblemWithStatus[]] => [k, v.filter(matches)])
          .filter(([, v]: [string, ProblemWithStatus[]]) => v.length > 0)
      )
    : liveGrouped;

  const visibleCount = Object.values(filteredGrouped).reduce((n, v) => n + v.length, 0);

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
        {/* Only offered once something is actually flagged — an empty filter is
            a control that can only disappoint. */}
        {flaggedCount > 0 && (
          <button
            onClick={() => setReviseOnly((v) => !v)}
            aria-pressed={showReviseOnly}
            title={showReviseOnly ? "Show all problems" : "Show only problems flagged for revision"}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors",
              showReviseOnly
                ? "border-rose-400/50 bg-rose-500/10 text-rose-300"
                : "border-border text-secondary hover:border-border-accent hover:text-primary",
            )}
          >
            <Flag size={11} className={showReviseOnly ? "fill-current" : ""} />
            For revision
            <span className="font-mono text-[10px] opacity-70">{flaggedCount}</span>
          </button>
        )}
        {(diffFilter !== "ALL" || compFilter !== "ALL" || showReviseOnly) && (
          <button
            onClick={() => { setDiffFilter("ALL"); setCompFilter("ALL"); setReviseOnly(false); }}
            className="flex items-center gap-1 text-xs text-muted hover:text-secondary border border-border rounded-xl px-2.5 py-1.5 transition-colors"
          >
            <X size={10} /> Clear
          </button>
        )}
        {onAddProblems && (
          <button
            onClick={onAddProblems}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs text-accent/80 hover:text-accent-hover hover:border-accent/50 hover:bg-accent/10 transition-colors duration-[--duration-feedback]"
          >
            <span className="text-sm leading-none">＋</span> Add Problems
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">By topic</h3>
      </div>

      {/* No results vs an empty sheet are different situations. Previously a
          filter that matched nothing rendered NOTHING — every topic section
          returned null and the page just ended, which looks identical to a
          sheet with no problems in it. */}
      {visibleCount === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center">
          <p className="text-sm font-medium text-secondary">No problems match these filters.</p>
          <p className="mt-1 text-xs text-muted">
            {[
              query.trim() && `search "${query.trim()}"`,
              diffFilter !== "ALL" && diffFilter.toLowerCase(),
              compFilter !== "ALL" && compFilter,
              showReviseOnly && "flagged for revision",
            ].filter(Boolean).join(" · ") || "Try widening your filters."}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs text-secondary transition-colors hover:border-border-accent hover:text-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Two levels: topic, then the patterns inside it. Sixteen flat pattern
          cards gave no sense of shape — two-pointer and sliding-window are
          array techniques, not siblings of "graphs". */}
      {/* Any pattern the topic map doesn't cover — rendered rather than dropped.
          Silently skipping these is what turned a 75-problem sheet into one
          problem when the database enum was out of step with the code. */}
      {(() => {
        const orphans = unmappedPatterns(Object.keys(filteredGrouped));
        if (orphans.length === 0) return null;
        const probs = orphans.flatMap((p) => filteredGrouped[p]);
        return (
          <section className="pt-8 first:pt-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-heading text-amber-400">Uncategorised</h3>
              <span className="shrink-0 text-xs text-muted">{probs.length} problems</span>
            </div>
            <p className="mt-2.5 text-sm text-secondary">
              These carry a pattern this build doesn&apos;t know about — usually a database
              that hasn&apos;t been migrated yet. They are listed so nothing is hidden.
            </p>
            <p className="mt-1 font-mono text-[11px] text-amber-400/80">{orphans.join(", ")}</p>
          </section>
        );
      })()}

      {visibleCount > 0 && TOPICS.map((topic) => {
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
              <span className="shrink-0 text-xs tabular-nums text-muted">{topicDone} / {topicProblems.length}</span>
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
              onClick={() => {
                setCollapsed((prev) => ({ ...prev, [pattern]: prev[pattern] === false }));
                if (isCollapsed) setEverOpened((prev) => (prev.has(pattern) ? prev : new Set(prev).add(pattern)));
              }}
              aria-expanded={!isCollapsed}
              aria-controls={`pattern-${pattern}`}
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
                  className={cn(!isCollapsed && "rotate-90")}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold capitalize text-primary">
                  {patternLabel(pattern)}
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

            <Collapse open={!isCollapsed} id={`pattern-${pattern}`} instant>
              <div className="divide-y divide-border border-t border-border">
                {(everOpened.has(pattern) ? problems : []).map((p, idx) => {
                  const status = statuses[p.id] ?? "TODO";
                  const noteOpen = openNoteId === p.id;
                  const hasNote = !!(notes[p.id]?.trim());
                  const isRevising = revising[p.id] ?? false;
                  const hintOpen = openHintId === p.id;
                  const wasHinted = usedHint[p.id] ?? false;
                  // Capped at 5 rows / 100ms. Uncapped this ran idx*20ms, so a
                  // 50-row group animated for a full second after every expand.
                  const animDelay = `${Math.min(idx, 5) * 20}ms`;

                  return (
                    <div key={p.id} className="animate-fade-in" style={{ animationDelay: animDelay }}>
                      {/* Problem row */}
                      <div className="problem-row flex items-start gap-3 px-4 py-2.5 hover:bg-border transition-colors">
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

                        {/* One row, one set of children.
                            The mobile and desktop arrangements used to be two
                            separately-written blocks, and BOTH shipped to the
                            DOM at every viewport — 83 nodes per problem, 12,387
                            on a 150-problem sheet, with CSS merely hiding one.
                            These are the same five cells rearranged by
                            grid-template-areas at md (see .problem-row-grid). */}
                        <div className="problem-row-grid min-w-0 flex-1">
                          <div style={{ gridArea: "title" }} className="problem-row-title flex min-w-0 items-center">
                            {p.leetcodeUrl ? (
                              <a
                                href={p.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Solve "${p.title}" on LeetCode`}
                                className="problem-title min-w-0 text-sm leading-snug text-secondary"
                              >
                                {p.title}
                              </a>
                            ) : (
                              <span className="min-w-0 text-sm leading-snug text-secondary">{p.title}</span>
                            )}
                          </div>

                          {/* Companies — 15px on mobile, 16px on desktop, sized
                              in CSS so the mark is rendered once. */}
                          <div
                            style={{ gridArea: "comp" }}
                            className="problem-row-comp flex items-center gap-2 opacity-70"
                          >
                            {p.companies.slice(0, 3).map((c) => (
                              <span key={c} title={c} className="inline-flex transition-opacity hover:opacity-100">
                                <CompanyLogo name={c} size={16} />
                              </span>
                            ))}
                          </div>

                          <div style={{ gridArea: "must" }} className="problem-row-must flex items-center justify-end">
                            {p.mustDo && (
                              <span className="shrink-0 rounded border border-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400/80">
                                must do
                              </span>
                            )}
                          </div>

                          <div style={{ gridArea: "diff" }} className="problem-row-diff flex items-center justify-end">
                            <span className={cn("shrink-0 text-xs font-medium", difficultyColor[p.difficulty])}>
                              {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                            </span>
                          </div>

                          <div style={{ gridArea: "act" }} className="problem-row-act flex items-center justify-end gap-1.5">
                            {p.leetcodeUrl && (
                              <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" title="Solve on LeetCode" className="row-action row-action-link rounded transition-opacity">
                                <LeetCodeIcon size={20} />
                              </a>
                            )}
                            {p.gfgUrl && (
                              <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" title="Solve on GeeksForGeeks" className="row-action row-action-link rounded transition-opacity">
                                <GFGIcon size={20} />
                              </a>
                            )}
                            {p.hint && (
                              <button onClick={() => toggleHint(p.id)} aria-expanded={hintOpen} aria-controls={`hint-${p.id}`} title={hintOpen ? "Hide hint" : wasHinted ? "Show hint (needed a hint)" : "Show hint"} className={cn("row-action rounded transition-colors", hintOpen || wasHinted ? "text-yellow-400 hover:text-yellow-300" : "row-action-idle hover:text-secondary")}>
                                <Lightbulb size={15} className={wasHinted ? "fill-current" : ""} />
                              </button>
                            )}
                            <button onClick={() => toggleRevise(p.id)} title={isRevising ? "Remove from revision list" : "Mark for revision"} className={cn("row-action rounded transition-colors", isRevising ? "text-rose-400 hover:text-rose-300" : "row-action-idle hover:text-secondary")}>
                              <Flag size={15} className={isRevising ? "fill-current" : ""} />
                            </button>
                            <button onClick={() => toggleNote(p.id)} data-note-trigger={p.id} aria-expanded={noteOpen} aria-controls={`note-${p.id}`} title={noteOpen ? "Close notes" : "Open notes"} className={cn("row-action rounded transition-colors", noteOpen || hasNote ? "text-amber-400/80 hover:text-amber-400" : "row-action-idle hover:text-secondary")}>
                              <PenLine size={15} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Hint panel. Plain text, so it stays mounted inside
                          Collapse — no unmount dance. */}
                      {p.hint && (
                        <Collapse open={hintOpen} id={`hint-${p.id}`}>
                          <div className="px-4 pb-3">
                            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
                              <Lightbulb size={14} className="mt-0.5 shrink-0 text-yellow-400" />
                              <p className="text-[13px] text-secondary leading-relaxed">{p.hint}</p>
                            </div>
                          </div>
                        </Collapse>
                      )}
                    </div>
                  );
                })}
              </div>
            </Collapse>
          </div>
        );
      })}
            </div>
          </section>
        );
      })}

      {/* One editor for the whole list, not one per row. It only mounts while a
          note is open, so its autofocus can't fight the page. */}
      {openNoteId && (
        <NoteModal
          problemId={openNoteId}
          userId={userId}
          title={allProblems.find((p) => p.id === openNoteId)?.title ?? "Notes"}
          initialContent={notes[openNoteId] ?? ""}
          onSaved={(content) =>
            setNotes((prev) => ({ ...prev, [openNoteId]: content }))
          }
          onClose={() => setOpenNoteId(null)}
        />
      )}
    </div>
  );
}
