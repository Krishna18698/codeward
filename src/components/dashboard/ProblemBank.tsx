"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { LeetCodeIcon } from "@/components/ui/LeetCodeIcon";
import { GFGIcon } from "@/components/ui/GFGIcon";

type Problem = {
  id: string; title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  pattern: string; mustDo: boolean;
  leetcodeUrl: string | null; gfgUrl: string | null; order: number;
  companies: string[];
};

type BankPattern = { pattern: string; total: number };

const COMPANY_DOMAINS: Record<string, string> = {
  Google: "google.com", Amazon: "amazon.com", Meta: "meta.com",
  Microsoft: "microsoft.com", Apple: "apple.com", "Goldman Sachs": "goldmansachs.com",
  LinkedIn: "linkedin.com", Netflix: "netflix.com", Uber: "uber.com",
  Airbnb: "airbnb.com", Adobe: "adobe.com", Twitter: "x.com",
  Flipkart: "flipkart.com", Swiggy: "swiggy.com", "Morgan Stanley": "morganstanley.com",
};

type UserSheet = { id: string; name: string };
type Props = { userSheets: UserSheet[] };

const DIFF_COLOR: Record<string, string> = {
  EASY:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400  bg-amber-500/10  border-amber-500/20",
  HARD:   "text-red-400    bg-red-500/10    border-red-500/20",
};

const patternLabel = (p: string) => p.replace(/_/g, " ").toLowerCase();

const PATTERN_DESCRIPTIONS: Record<string, string> = {
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
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
          />
        </div>

        <select
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50"
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
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500/50"
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
              : "border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          ★ Must Do
        </button>

        {!patternsLoading && (
          <span className="text-xs text-slate-600 ml-auto">{totalProblems} problems</span>
        )}
      </div>

      {/* Pattern groups */}
      {patternsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-slate-700/60" />
                <div className="h-3 w-8 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : bankPatterns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-slate-500 text-sm">No problems match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bankPatterns.map((bp) => {
            const isExpanded = expandedPattern === bp.pattern;
            const probs = patternProblems[bp.pattern] ?? [];
            const isLoading = loadingPattern === bp.pattern;

            return (
              <div key={bp.pattern} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                {/* Pattern header */}
                <button
                  onClick={() => togglePattern(bp.pattern)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-300 capitalize">
                        {patternLabel(bp.pattern)}
                      </span>
                      <span className="text-[10px] text-slate-600">{bp.total}</span>
                    </div>
                    {PATTERN_DESCRIPTIONS[bp.pattern] && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {PATTERN_DESCRIPTIONS[bp.pattern]}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className={cn("text-slate-600 transition-transform duration-200", isExpanded && "rotate-90")}
                  />
                </button>

                {/* Problems */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/60 border-t border-slate-800/60">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                          <div className="w-7 h-3 rounded bg-slate-800 shrink-0" />
                          <div className="flex-1 h-3 rounded bg-slate-700/60" />
                          <div className="w-12 h-3 rounded bg-slate-800 shrink-0" />
                        </div>
                      ))
                    ) : probs.length === 0 ? (
                      <div className="px-4 py-4 text-center text-xs text-slate-600">No problems found.</div>
                    ) : (
                      probs.map((p) => (
                        <div key={p.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                          {/* Order number */}
                          <span className="text-sm font-semibold text-slate-500 font-mono w-7 shrink-0 text-center self-center">{p.order}</span>

                          {/* Content: 2-line mobile / 1-line desktop */}
                          <div className="flex-1 min-w-0">

                            {/* Mobile 2-line */}
                            <div className="md:hidden space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm text-slate-200 leading-snug">{p.title}</span>
                                {p.mustDo && (
                                  <span className="shrink-0 text-[10px] text-amber-400/70 border border-amber-500/20 rounded px-1 py-0.5 mt-0.5">must do</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <div className="flex-1 flex items-center gap-1">
                                  {p.companies.slice(0, 4).map((c) => {
                                    const domain = COMPANY_DOMAINS[c];
                                    return domain ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img key={c} loading="lazy" decoding="async" src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={c} title={c} width={15} height={15} className="rounded-sm opacity-75 hover:opacity-100 transition-opacity" />
                                    ) : null;
                                  })}
                                </div>
                                <span className={`text-[11px] border rounded-full px-2 py-0.5 shrink-0 ${DIFF_COLOR[p.difficulty]}`}>
                                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                                </span>
                                <div className="flex-1 flex items-center justify-end">
                                  {p.leetcodeUrl && (
                                    <a href={p.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded opacity-60 hover:opacity-100 transition-opacity" title="Solve on LeetCode">
                                      <LeetCodeIcon size={20} />
                                    </a>
                                  )}
                                  {p.gfgUrl && (
                                    <a href={p.gfgUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded opacity-60 hover:opacity-100 transition-opacity" title="Solve on GeeksForGeeks">
                                      <GFGIcon size={20} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Desktop: 5-column — title | companies | must-do | difficulty | links */}
                            <div
                              className="hidden md:grid items-center gap-x-4"
                              style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,100px) 72px 72px minmax(0,1fr)" }}
                            >
                              <span className="text-sm text-slate-200 leading-snug min-w-0 truncate">{p.title}</span>

                              {/* Companies */}
                              <div className="flex items-center justify-center gap-1.5">
                                {p.companies.slice(0, 4).map((c) => {
                                  const domain = COMPANY_DOMAINS[c];
                                  return domain ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={c} loading="lazy" decoding="async" src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={c} title={c} width={16} height={16} className="rounded-sm opacity-80 hover:opacity-100 transition-opacity" />
                                  ) : null;
                                })}
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
                              <span className="flex items-center gap-1 text-[11px] text-emerald-400 border border-emerald-500/20 rounded-lg px-2 py-1">
                                <Check size={10} /> Added
                              </span>
                            ) : adding === p.id ? (
                              <span className="text-[11px] text-slate-500 border border-slate-800 rounded-lg px-2 py-1">Adding…</span>
                            ) : userSheets.length === 1 ? (
                              <button
                                onClick={() => addToSheet(p.id, userSheets[0].id)}
                                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/60 rounded-lg px-2 py-1 transition"
                              >
                                <Plus size={10} /> Add
                              </button>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => setDropdownOpen(dropdownOpen === p.id ? null : p.id)}
                                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/60 rounded-lg px-2 py-1 transition"
                                >
                                  <Plus size={10} /> Add
                                </button>
                                {dropdownOpen === p.id && (
                                  <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-slate-700 bg-[#0d1117] shadow-xl py-1">
                                    {userSheets.map((s) => (
                                      <button
                                        key={s.id}
                                        onClick={() => addToSheet(p.id, s.id)}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition truncate"
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
