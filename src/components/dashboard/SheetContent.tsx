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
};

function StatsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-3.5 space-y-2 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-36 rounded bg-slate-700/60" />
        <div className="h-3 w-12 rounded bg-slate-800" />
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 w-full" />
      <div className="flex items-center gap-4 pt-0.5">
        <div className="h-3 w-20 rounded bg-slate-800" />
        <div className="h-3 w-20 rounded bg-slate-800" />
      </div>
    </div>
  );
}

function ProblemsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden animate-pulse">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-20 rounded bg-slate-700/60" />
              <div className="h-2.5 w-8 rounded bg-slate-800" />
            </div>
            <div className="h-2 w-20 rounded-full bg-slate-800" />
          </div>
          <div className="border-t border-slate-800/60 divide-y divide-slate-800/60">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1 h-3 rounded bg-slate-700/60" />
                <div className="w-10 h-3 rounded bg-slate-800 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SheetContent({ sheets, defaultSheetId, userId, initialData, initialNotes }: Props) {
  const activeSheetId = defaultSheetId;

  // Track which sheetId was pre-fetched so we skip the first fetch for it
  const preloadedSheetId = useRef(initialData ? defaultSheetId : null);

  const [data, setData]         = useState<ApiResponse | null>(initialData ?? null);
  const [notes, setNotes]       = useState<Record<string, string>>(initialNotes ?? {});
  const [loading, setLoading]   = useState(initialData ? false : !!activeSheetId);
  const [liveDone, setLiveDone] = useState<number | null>(null);
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
  const handleStatusChange = (prev: ProblemStatus, next: ProblemStatus) => {
    if (prev === next) return;
    setLiveDone((d) => {
      const base = d ?? data?.doneCount ?? 0;
      return base + (next === "DONE" ? 1 : 0) - (prev === "DONE" ? 1 : 0);
    });
  };

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  if (!activeSheet && !loading) return null;

  const total     = data?.total     ?? 0;
  const doneCount = liveDone ?? data?.doneCount ?? 0;
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const grouped: Record<string, ProblemWithStatus[]> = {};
  if (data) {
    for (const p of data.problems) {
      if (!grouped[p.pattern]) grouped[p.pattern] = [];
      grouped[p.pattern].push(p);
    }
  }

  return (
    <>
      {/* Stats bar */}
      {loading ? (
        <StatsSkeleton />
      ) : activeSheet ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-3.5 space-y-2">
          {/* Progress row */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white truncate">{activeSheet.name}</span>
            <span className="text-xs text-slate-500 shrink-0">{pct}% done</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Counts row */}
          <div className="flex items-center gap-4 pt-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">{doneCount}</span>
              <span className="text-xs text-slate-500">solved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle size={13} className="text-slate-500" />
              <span className="text-sm font-semibold text-white">{total - doneCount}</span>
              <span className="text-xs text-slate-500">to do</span>
            </div>
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
        />
      ) : activeSheet ? (
        <div className="rounded-2xl border border-dashed border-slate-800 px-5 py-16 text-center">
          <p className="text-slate-400 text-sm">This sheet has no problems yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Use <span className="text-sky-400">＋ Add Problems</span> in the filters, or browse the{" "}
            <Link href="/dashboard/dsa?view=bank" className="text-sky-400 hover:underline">
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
