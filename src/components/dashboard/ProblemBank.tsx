"use client";
import { useState, useEffect, useCallback } from "react";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { Search, Plus, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import Collapse from "@/components/ui/Collapse";
import { LeetCodeIcon } from "@/components/ui/LeetCodeIcon";
import { GFGIcon } from "@/components/ui/GFGIcon";
import { PATTERNS, patternRank, patternLabel, TOPICS } from "@/content/patterns";

type Problem = {
  id: string; title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  pattern: string; mustDo: boolean;
  leetcodeUrl: string | null; gfgUrl: string | null; order: number;
  companies: string[];
};

type BankPattern = { pattern: string; total: number };

type UserSheet = { id: string; name: string };
type Props = { userSheets: UserSheet[] };

const DIFF_COLOR: Record<string, string> = {
  EASY:   "text-accent bg-accent/10 border-accent/20",
  MEDIUM: "text-amber-400  bg-amber-500/10  border-amber-500/20",
  HARD:   "text-red-400    bg-red-500/10    border-red-500/20",
};

/** Text-only difficulty for the phone row — the pill above is for the desktop
 *  grid, where it sits in its own column and needs the edge to read as a cell. */
const DIFF_TEXT: Record<string, string> = {
  EASY:   "text-accent",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
};


export default function ProblemBank({ userSheets }: Props) {
  const [q, setQ]               = useState("");
  const [diff, setDiff]         = useState<string>("ALL");
  const [mustDo, setMustDo]     = useState(false);
  const [comp, setComp]         = useState<string>("ALL");
  const [bankCompanies, setBankCompanies] = useState<string[]>([]);

  // Pattern-grouped state
  const [bankPatterns, setBankPatterns]       = useState<BankPattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [patternProblems, setPatternProblems] = useState<Record<string, Problem[]>>({});
  const [loadingPattern, setLoadingPattern]   = useState<string | null>(null);

  // Add-to-sheet state
  const [added, setAdded]               = useState<Record<string, string>>({});
  const [adding, setAdding]             = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Fetch companies for filter
  useEffect(() => {
    fetch("/api/dsa/sheet-companies?sheetId=preset-top300")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json() as { companies?: string[] };
        setBankCompanies(d.companies ?? []);
      })
      .catch(() => {});
  }, []);

  // Fetch pattern list whenever filters change
  const fetchPatterns = useCallback(async () => {
    setPatternsLoading(true);
    setPatternProblems({});
    setExpandedPattern(null);
    const params = new URLSearchParams();
    if (q)              params.set("q", q);
    if (diff !== "ALL") params.set("difficulty", diff);
    if (mustDo)         params.set("mustDo", "true");
    if (comp !== "ALL") params.set("company", comp);
    try {
      const res = await fetch(`/api/dsa/bank-patterns?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { patterns: BankPattern[] };
      setBankPatterns((data.patterns ?? []).sort((a, b) => patternRank(a.pattern) - patternRank(b.pattern)));
    } finally {
      setPatternsLoading(false);
    }
  }, [q, diff, mustDo, comp]);

  useEffect(() => {
    const t = setTimeout(fetchPatterns, 200);
    return () => clearTimeout(t);
  }, [fetchPatterns]);

  // Fetch problems for a specific pattern (lazy)
  const fetchPatternProblems = useCallback(async (pattern: string, alreadyLoaded: boolean) => {
    if (alreadyLoaded) return;
    setLoadingPattern(pattern);
    const params = new URLSearchParams({ pattern });
    if (q)              params.set("q", q);
    if (diff !== "ALL") params.set("difficulty", diff);
    if (mustDo)         params.set("mustDo", "true");
    if (comp !== "ALL") params.set("company", comp);
    try {
      const res = await fetch(`/api/dsa/bank?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { problems: Problem[] };
      setPatternProblems((prev) => ({ ...prev, [pattern]: data.problems ?? [] }));
    } finally {
      setLoadingPattern(null);
    }
  }, [q, diff, mustDo, comp]);

  const togglePattern = async (pattern: string) => {
    if (expandedPattern === pattern) {
      setExpandedPattern(null);
    } else {
      setExpandedPattern(pattern);
      await fetchPatternProblems(pattern, patternProblems[pattern] !== undefined);
    }
  };

  const addToSheet = async (problemId: string, sheetId: string) => {
    setAdding(problemId);
    setDropdownOpen(null);
    try {
      const res = await fetch(`/api/dsa/sheets/${sheetId}/add-problem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      if (res.ok || res.status === 409) {
        setAdded((prev) => ({ ...prev, [problemId]: sheetId }));
        const sheetName = userSheets.find((s) => s.id === sheetId)?.name;
        toast.success(sheetName ? `Added to ${sheetName}` : "Added to sheet");
      } else {
        toast.error("Couldn't add the problem — try again.");
      }
    } catch {
      toast.error("Couldn't add the problem — try again.");
    } finally {
      setAdding(null);
    }
  };

  const totalProblems = bankPatterns.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/50"
          />
        </div>

        <select
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-secondary focus:outline-none focus:border-accent/50"
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        {bankCompanies.length > 0 && (
          <select
            value={comp}
            onChange={(e) => setComp(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-secondary focus:outline-none focus:border-accent/50"
          >
            <option value="ALL">All companies</option>
            {bankCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <button
          onClick={() => setMustDo((v) => !v)}
          className={`px-3 py-2 rounded-xl text-sm border transition ${
            mustDo
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "border-border text-muted hover:text-secondary"
          }`}
        >
          ★ Must Do
        </button>

        {!patternsLoading && (
          <span className="text-xs text-muted ml-auto">{totalProblems} problems</span>
        )}
      </div>

      {/* Pattern groups */}
      {patternsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface px-4 py-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-skeleton" />
                <div className="h-3 w-8 rounded bg-skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : bankPatterns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted text-sm">No problems match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Same two-level shape as the sheets: topic, then the patterns
              inside it. The bank is 500 problems — a flat list of 40+ pattern
              cards gave no way to see which area you were browsing. */}
          {TOPICS.map((topic) => {
            const inTopic = bankPatterns.filter((bp) => topic.patterns.includes(bp.pattern));
            if (inTopic.length === 0) return null;
            const topicTotal = inTopic.reduce((sum, bp) => sum + bp.total, 0);

            return (
              <section key={topic.key} className="pt-8 first:pt-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-2xl font-semibold tracking-heading text-primary">{topic.label}</h3>
                  <span className="shrink-0 text-xs text-muted">
                    {topicTotal} problem{topicTotal === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="mt-2.5 text-sm text-secondary">{topic.blurb}</p>

                <div className="mt-4 space-y-2.5">
          {inTopic.map((bp) => {
            const isExpanded = expandedPattern === bp.pattern;
            const probs = patternProblems[bp.pattern] ?? [];
            const isLoading = loadingPattern === bp.pattern;

            return (
              <div key={bp.pattern} className="overflow-hidden rounded-xl border border-border bg-surface">
                {/* Pattern header */}
                <button
                  onClick={() => togglePattern(bp.pattern)}
                  aria-expanded={isExpanded}
                  aria-controls={`bank-${bp.pattern}`}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isExpanded ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted",
                    )}
                  >
                    <ChevronRight
                      size={15}
                      className={cn(isExpanded && "rotate-90")}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold capitalize text-primary">
                      {patternLabel(bp.pattern)}
                    </span>
                    {PATTERNS[bp.pattern]?.cue && (
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                        {PATTERNS[bp.pattern].cue}
                      </span>
                    )}
                  </span>

                  <span className="shrink-0 rounded-full border border-border px-3 py-1.5 font-mono text-[11px] tabular-nums text-muted">
                    {bp.total}
                  </span>
                </button>

                {/* Problems */}
                <Collapse open={isExpanded} id={`bank-${bp.pattern}`} instant>
                  <div className="divide-y divide-border border-t border-border">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                          <div className="w-7 h-3 rounded bg-skeleton shrink-0" />
                          <div className="flex-1 h-3 rounded bg-skeleton" />
                          <div className="w-12 h-3 rounded bg-skeleton shrink-0" />
                        </div>
                      ))
                    ) : probs.length === 0 ? (
                      <div className="px-4 py-4 text-center text-xs text-muted">No problems found.</div>
                    ) : (
                      probs.map((p) => (
                        <div key={p.id} className="problem-row flex items-start gap-3 px-4 py-2.5 hover:bg-border transition-colors">
                          {/* Order number */}
                          <span className="text-sm font-semibold text-muted font-mono w-7 shrink-0 text-center self-center">{p.order}</span>

                          {/* Content: 2-line mobile / 1-line desktop */}
                          <div className="flex-1 min-w-0">

            {/* Two lines — title, then difficulty, marks and actions. The
                            must-do badge is dropped because the list is already
                            ordered must-do first.

                            Which block renders is decided by the ROW's width, not
                            the viewport's (see .problem-row in globals.css): this
                            row spends ~130px on the order number and the Add
                            button, so a viewport breakpoint switched the table on
                            long before there was room for it. */}
                            <div className="row-narrow-only space-y-1.5">
                              {/* Title gets the whole first line here, unlike the
                                  sheet: this row also carries the order number and
                                  the Add-to-sheet button, so there is ~70px less to
                                  work with and difficulty on line 1 pushed most
                                  titles onto a second line. */}
                              <div className="flex items-start">
                                {p.leetcodeUrl ? (
                                  <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="problem-title min-w-0 text-sm text-primary leading-snug">{p.title}</a>
                                ) : (
                                  <span className="min-w-0 text-sm text-primary leading-snug">{p.title}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`shrink-0 text-xs font-medium ${DIFF_TEXT[p.difficulty]}`}>
                                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                                </span>
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  {p.companies.slice(0, 4).map((c) => (
                                    <span key={c} title={c} className="inline-flex opacity-75 hover:opacity-100 transition-opacity">
                                      <CompanyLogo name={c} size={15} />
                                    </span>
                                  ))}
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  {p.leetcodeUrl && (
                                    <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="row-action rounded" title="Solve on LeetCode">
                                      <LeetCodeIcon size={20} />
                                    </a>
                                  )}
                                  {p.gfgUrl && (
                                    <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" className="row-action rounded" title="Solve on GeeksForGeeks">
                                      <GFGIcon size={20} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 5-column — title | companies | must-do | difficulty | links.
                                Fixed tracks except the title: the 76px link track is
                                the pair's own width (two 36px links and a 4px gap),
                                so it cannot be squeezed over the difficulty pill the
                                way minmax(0, 1fr) allowed. */}
                            <div
                              className="row-wide-only items-center gap-x-4"
                              style={{ gridTemplateColumns: "minmax(0,1fr) 100px 72px 72px 76px" }}
                            >
                              {p.leetcodeUrl ? (
                                <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" title={`Solve "${p.title}" on LeetCode`} className="problem-title text-sm text-primary leading-snug min-w-0 truncate">{p.title}</a>
                              ) : (
                                <span className="text-sm text-primary leading-snug min-w-0 truncate">{p.title}</span>
                              )}

                              {/* Companies */}
                              <div className="flex items-center justify-center gap-1.5">
                                {p.companies.slice(0, 4).map((c) => (
                                  <span key={c} title={c} className="inline-flex opacity-80 hover:opacity-100 transition-opacity">
                                    <CompanyLogo name={c} size={16} />
                                  </span>
                                ))}
                              </div>

                              {/* Must do */}
                              <div className="flex items-center justify-center">
                                {p.mustDo && (
                                  <span className="text-[10px] text-amber-400/70 border border-amber-500/20 rounded px-1.5 py-0.5">must do</span>
                                )}
                              </div>

                              {/* Difficulty */}
                              <div className="flex items-center justify-center">
                                <span className={`text-[11px] border rounded-full px-2 py-0.5 shrink-0 ${DIFF_COLOR[p.difficulty]}`}>
                                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                                </span>
                              </div>

                              {/* Links */}
                              <div className="flex items-center justify-end gap-1">
                                {p.leetcodeUrl && (
                                  <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded opacity-60 hover:opacity-100 transition-opacity" title="Solve on LeetCode">
                                    <LeetCodeIcon size={20} />
                                  </a>
                                )}
                                {p.gfgUrl && (
                                  <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded opacity-60 hover:opacity-100 transition-opacity" title="Solve on GeeksForGeeks">
                                    <GFGIcon size={20} />
                                  </a>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* Add to sheet */}
                          <div className="shrink-0 self-center">
                            {userSheets.length === 0 ? null : added[p.id] ? (
                              <span className="flex items-center gap-1 text-[11px] text-accent border border-accent/20 rounded-lg px-2 py-1">
                                <Check size={10} /> Added
                              </span>
                            ) : adding === p.id ? (
                              <span className="text-[11px] text-muted border border-border rounded-lg px-2 py-1">Adding…</span>
                            ) : userSheets.length === 1 ? (
                              <button
                                onClick={() => addToSheet(p.id, userSheets[0].id)}
                                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover border border-accent/30 hover:border-accent/60 rounded-lg px-2 py-1 transition"
                              >
                                <Plus size={10} /> Add
                              </button>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => setDropdownOpen(dropdownOpen === p.id ? null : p.id)}
                                  className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover border border-accent/30 hover:border-accent/60 rounded-lg px-2 py-1 transition"
                                >
                                  <Plus size={10} /> Add
                                </button>
                                {dropdownOpen === p.id && (
                                  <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-border bg-surface shadow-xl py-1">
                                    {userSheets.map((s) => (
                                      <button
                                        key={s.id}
                                        onClick={() => addToSheet(p.id, s.id)}
                                        className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-border transition truncate"
                                      >
                                        {s.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Collapse>
              </div>
            );
          })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
