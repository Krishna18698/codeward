"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import ProblemList from "./ProblemList";
import AddProblemsModal from "./AddProblemsModal";
import type { Difficulty, ProblemPattern, ProblemStatus } from "@prisma/client";

type Sheet = { id: string; name: string; isPreset: boolean; problemCount: number };

type ProblemWithStatus = {
  id: string; title: string;
  difficulty: Difficulty; pattern: ProblemPattern;
  mustDo: boolean; leetcodeUrl: string | null; gfgUrl: string | null;
  companies: string[];
  order: number;
  statuses: { status: ProblemStatus; toRevise: boolean }[];
  [key: string]: unknown;
};

type ApiResponse = {
  problems: ProblemWithStatus[];
  total: number;
  doneCount: number | null;
  solvingCount: number | null;
};

type Props = {
  sheets: Sheet[];
  defaultSheetId: string | undefined;
  userId: string;
  initialData?: ApiResponse | null;
  initialNotes?: Record<string, string>;
  /** Last-Minute view — the must-do cut of this sheet, for the night before. */
  lastMinute?: boolean;
};

function StatsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-3.5 space-y-2 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-36 rounded bg-elevated" />
        <div className="h-3 w-12 rounded bg-border" />
      </div>
      <div className="h-1.5 rounded-full bg-border w-full" />
      <div className="flex items-center gap-4 pt-0.5">
        <div className="h-3 w-20 rounded bg-border" />
        <div className="h-3 w-20 rounded bg-border" />
      </div>
    </div>
  );
}

function ProblemsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-20 rounded bg-elevated" />
              <div className="h-2.5 w-8 rounded bg-border" />
            </div>
            <div className="h-2 w-20 rounded-full bg-border" />
          </div>
          <div className="border-t border-border divide-y divide-border">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-6 h-6 rounded-full bg-border shrink-0" />
                <div className="flex-1 h-3 rounded bg-elevated" />
                <div className="w-10 h-3 rounded bg-border shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SheetContent({ sheets, defaultSheetId, userId, initialData, initialNotes, lastMinute = false }: Props) {
  const activeSheetId = defaultSheetId;

  // Track which sheetId was pre-fetched so we skip the first fetch for it
  const preloadedSheetId = useRef(initialData ? defaultSheetId : null);

  const [data, setData]         = useState<ApiResponse | null>(initialData ?? null);
  const [notes, setNotes]       = useState<Record<string, string>>(initialNotes ?? {});
  const [loading, setLoading]   = useState(initialData ? false : !!activeSheetId);
  const [liveDone, setLiveDone] = useState<number | null>(null);
  // Per-difficulty deltas layered over the base counts computed from `data`.
  const [diffDelta, setDiffDelta] = useState<Record<string, number>>({});
  const [showAddProblems, setShowAddProblems] = useState(false);

  useEffect(() => {
    if (!activeSheetId) return;
    // Skip the fetch for the sheet that was pre-loaded server-side
    if (preloadedSheetId.current === activeSheetId) {
      preloadedSheetId.current = null;
      return;
    }
    let cancelled = false;
    // Data fetch on sheet change — effect-driven setState is intentional here.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setData(null);
    setLiveDone(null);
    setDiffDelta({});
    /* eslint-enable react-hooks/set-state-in-effect */
    Promise.all([
      fetch(`/api/dsa/problems?sheetId=${activeSheetId}&skip=0&take=1000`).then((r) => r.json() as Promise<ApiResponse>),
      fetch(`/api/notes?sheetId=${activeSheetId}`).then((r) => r.json() as Promise<Record<string, string>>),
    ])
      .then(([problems, notesMap]) => {
        if (!cancelled) {
          setData(problems);
          setNotes(notesMap);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSheetId]);

  // Called by ProblemList whenever user toggles a status — keeps the bar in sync
  const handleStatusChange = (prev: ProblemStatus, next: ProblemStatus, difficulty?: Difficulty) => {
    if (prev === next) return;
    const delta = (next === "DONE" ? 1 : 0) - (prev === "DONE" ? 1 : 0);
    setLiveDone((d) => (d ?? data?.doneCount ?? 0) + delta);
    if (difficulty && delta !== 0) {
      setDiffDelta((m) => ({ ...m, [difficulty]: (m[difficulty] ?? 0) + delta }));
    }
  };

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  if (!activeSheet && !loading) return null;

  // Last Minute is a filtered VIEW of this sheet, not a separate sheet — the
  // rows are the same Problem ids, so progress carries over for free.
  const visible = lastMinute
    ? (data?.problems ?? []).filter((p) => p.mustDo)
    : (data?.problems ?? []);

  const liveDelta = Object.values(diffDelta).reduce((a, b) => a + b, 0);
  const visibleDone = visible.filter((p) => p.statuses?.[0]?.status === "DONE").length;

  const total     = lastMinute ? visible.length : (data?.total ?? 0);
  const doneCount = lastMinute
    ? Math.max(0, visibleDone + liveDelta)
    : (liveDone ?? data?.doneCount ?? 0);
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Easy/Medium/Hard split — a single bar hides that someone has done 60 easies
  // and no hards. Computed client-side; difficulty is already on every problem.
  const DIFFS: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
  const byDiff: Record<string, { done: number; total: number }> = {
    EASY: { done: 0, total: 0 }, MEDIUM: { done: 0, total: 0 }, HARD: { done: 0, total: 0 },
  };
  for (const p of visible) {
    const b = byDiff[p.difficulty];
    if (!b) continue;
    b.total++;
    if (p.statuses?.[0]?.status === "DONE") b.done++;
  }
  for (const d of DIFFS) byDiff[d].done = Math.max(0, byDiff[d].done + (diffDelta[d] ?? 0));

  const diffStyle: Record<string, string> = {
    EASY: "text-accent", MEDIUM: "text-amber-400", HARD: "text-red-400",
  };
  const diffBar: Record<string, string> = {
    EASY: "bg-accent-fill", MEDIUM: "bg-amber-500", HARD: "bg-red-500",
  };

  const grouped: Record<string, ProblemWithStatus[]> = {};
  for (const p of visible) {
    if (!grouped[p.pattern]) grouped[p.pattern] = [];
    grouped[p.pattern].push(p);
  }

  return (
    <>
      {/* Stats bar */}
      {loading ? (
        <StatsSkeleton />
      ) : activeSheet ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-3.5 space-y-2">
          {/* Progress row */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-primary truncate">{activeSheet.name}</span>
            <span className="text-xs text-muted shrink-0">{pct}% done</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full w-full origin-left bg-accent-fill transition-transform duration-700"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
          {/* Counts row */}
          <div className="flex items-center gap-4 pt-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-accent" />
              <span className="text-sm font-semibold text-primary">{doneCount}</span>
              <span className="text-xs text-muted">solved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle size={13} className="text-muted" />
              <span className="text-sm font-semibold text-primary">{total - doneCount}</span>
              <span className="text-xs text-muted">to do</span>
            </div>
          </div>

          {/* Difficulty as bars, not a text row — a fraction tells you the
              numbers, a bar tells you the shape without reading. */}
          <div className="grid gap-2 pt-1 sm:grid-cols-3">
            {DIFFS.map((d) => {
              const b = byDiff[d];
              const dpct = b.total > 0 ? (b.done / b.total) * 100 : 0;
              return (
                <div key={d}>
                  <div className="mb-1 flex items-baseline justify-between font-mono text-[11px]">
                    <span className={diffStyle[d]}>{d.charAt(0) + d.slice(1).toLowerCase()}</span>
                    <span className="text-muted">{b.done}/{b.total}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full w-full origin-left rounded-full transition-transform duration-700 ${diffBar[d]}`}
                      style={{ transform: `scaleX(${dpct / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Problem list */}
      {loading ? (
        <ProblemsSkeleton />
      ) : data && data.problems.length > 0 ? (
        <ProblemList
          grouped={grouped}
          userId={userId}
          sheetId={activeSheetId!}
          initialNotes={notes}
          onStatusChange={handleStatusChange}
          onAddProblems={activeSheet && !activeSheet.isPreset ? () => setShowAddProblems(true) : undefined}
          mustDoOnly={lastMinute}
        />
      ) : activeSheet ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
          <p className="text-secondary text-sm">This sheet has no problems yet.</p>
          <p className="text-muted text-xs mt-1">
            Use <span className="text-accent">＋ Add Problems</span> in the filters, or browse the{" "}
            <Link href="/dashboard/dsa?view=bank" className="text-accent hover:underline">
              Problem Bank
            </Link>.
          </p>
        </div>
      ) : null}

      {showAddProblems && activeSheet && (
        <AddProblemsModal
          sheetId={activeSheet.id}
          sheetName={activeSheet.name}
          onClose={() => setShowAddProblems(false)}
        />
      )}
    </>
  );
}
