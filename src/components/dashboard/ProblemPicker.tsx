"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X } from "lucide-react";

export type PickerProblem = {
  id: string; title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  pattern: string; mustDo: boolean;
  leetcodeUrl: string | null; order: number;
  sheetName: string;
};

type Props = {
  excludeSheetId?: string;
  selected: PickerProblem[];
  onToggle: (p: PickerProblem) => void;
};

const DIFF_COLOR: Record<string, string> = {
  EASY:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400  bg-amber-500/10  border-amber-500/20",
  HARD:   "text-red-400    bg-red-500/10    border-red-500/20",
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 rounded bg-slate-700/60 w-3/5" />
        <div className="h-2 rounded bg-slate-800/80 w-1/4" />
      </div>
      <div className="h-4 w-10 rounded-full bg-slate-800/80 shrink-0" />
      <div className="h-5 w-10 rounded-lg bg-slate-800/80 shrink-0" />
    </div>
  );
}

export default function ProblemPicker({ excludeSheetId, selected, onToggle }: Props) {
  const [q, setQ]                       = useState("");
  const [comp, setComp]                 = useState("ALL");
  const [companies, setCompanies]       = useState<string[]>([]);
  const [results, setResults]           = useState<PickerProblem[]>([]);
  const [loading, setLoading]           = useState(false);
  const [hasSearched, setHasSearched]   = useState(false);

  // Fetch real company list from preset sheets
  useEffect(() => {
    fetch("/api/dsa/sheet-companies?preset=true")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json() as { companies?: string[] };
        setCompanies(d.companies ?? []);
      })
      .catch(() => {});
  }, []);

  const selectedIds = new Set(selected.map((p) => p.id));

  const search = useCallback(async () => {
    // Only search when there's a query or filter active
    if (!q && comp === "ALL") {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    const params = new URLSearchParams();
    if (q)              params.set("q", q);
    if (comp !== "ALL") params.set("company", comp);
    if (excludeSheetId) params.set("excludeSheetId", excludeSheetId);
    try {
      const res = await fetch(`/api/dsa/problems/search?${params}`);
      const data = await res.json() as { problems: PickerProblem[] };
      setResults(data.problems ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, comp, excludeSheetId]);

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="flex flex-col gap-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs rounded-full pl-2.5 pr-1.5 py-1"
            >
              {p.title.length > 24 ? p.title.slice(0, 24) + "…" : p.title}
              <button onClick={() => onToggle(p)} className="text-sky-400 hover:text-sky-200 ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className="w-full pl-7 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition"
          />
        </div>
        <select
          value={comp}
          onChange={(e) => setComp(e.target.value)}
          className="bg-slate-900/80 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 transition w-32 shrink-0"
        >
          <option value="ALL">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60">
        {loading ? (
          <>
            <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
          </>
        ) : !q && comp === "ALL" ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Search by name or filter by company…
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className="py-6 text-center text-xs text-slate-500">No problems match.</div>
        ) : (
          results.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 transition ${
                  isSelected ? "opacity-50" : "hover:bg-slate-800/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-slate-500">{p.sheetName}</p>
                    <span className={`text-[10px] border rounded-full px-1.5 py-0.5 ${DIFF_COLOR[p.difficulty]}`}>
                      {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => !isSelected && onToggle(p)}
                  disabled={isSelected}
                  className={`shrink-0 flex items-center gap-1 text-xs border rounded-xl px-3 py-1.5 transition ${
                    isSelected
                      ? "text-slate-500 border-slate-700 cursor-not-allowed"
                      : "text-sky-400 border-sky-500/30 hover:border-sky-500/60 hover:text-sky-300"
                  }`}
                >
                  {!isSelected && <Plus size={10} />}
                  {isSelected ? "Added" : "Add"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
