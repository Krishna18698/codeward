export const dynamic = "force-dynamic";

import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProblemBank from "@/components/dashboard/ProblemBank";
import DSAPageClient from "@/components/dashboard/DSAPageClient";
import SheetContent from "@/components/dashboard/SheetContent";
import PageHeader from "@/components/ui/PageHeader";

type Props = { searchParams: Promise<{ sheet?: string; view?: string }> };

export default async function DSAPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { sheet: sheetId, view } = await searchParams;
  const showBank = view === "bank";
  // A condensed "night before the interview" cut — the must-do problems of the
  // selected sheet. A VIEW, not a new sheet, so progress carries over.
  const lastMinute = view === "lastminute";

  // Loads a sheet's problems + statuses + notes in one parallel batch.
  const loadSheet = (sid: string) =>
    Promise.all([
      prisma.problem.findMany({
        where: { sheetId: sid },
        select: {
          id: true, title: true, difficulty: true,
          pattern: true, mustDo: true, leetcodeUrl: true, gfgUrl: true,
          order: true, companies: true,
          statuses: { where: { userId }, select: { status: true, toRevise: true } },
        },
        orderBy: [{ mustDo: "desc" }, { order: "asc" }],
      }),
      prisma.userProblemStatus.findMany({
        where: { userId, problem: { sheetId: sid } },
        select: { status: true },
      }),
      prisma.userNote.findMany({
        where: { userId, problem: { sheetId: sid }, problemId: { not: null } },
        select: { problemId: true, content: true },
      }),
    ]);

  // If the sheet is already known from the URL, start its data load NOW so it
  // overlaps the sheet-list query instead of waiting for it (kills the waterfall).
  const knownSheetLoad = sheetId && !showBank ? loadSheet(sheetId) : null;

  const [sheets, doneTotal, doneBySheet] = await Promise.all([
    prisma.sheet.findMany({
      where: { OR: [{ isPreset: true }, { userId }] },
      include: { _count: { select: { problems: true } } },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
    }),
    prisma.userProblemStatus.count({ where: { userId, status: "DONE" } }),
    // Per-sheet solved counts, so a sheet tab can show "12 / 75 solved" without
    // a query per sheet. Grouped from the Problem side because Prisma can't
    // group UserProblemStatus by a field on its relation.
    prisma.problem.groupBy({
      by: ["sheetId"],
      where: { statuses: { some: { userId, status: "DONE" } } },
      _count: { _all: true },
    }),
  ]);

  const solvedIn = new Map(doneBySheet.map((g) => [g.sheetId, g._count._all]));

  // Custom sheets for the "add to sheet" dropdown in ProblemBank
  const userSheets = sheets
    .filter((s) => !s.isPreset)
    .map((s) => ({ id: s.id, name: s.name }));

  // Exclude the bank preset from the sheet tabs (it lives in Problem Bank)
  const tabSheets = sheets.filter((s) => s.source !== "TOP300");

  // Shape passed to the client component (safe to serialize — no dates/enums that break)
  const clientSheets = tabSheets.map((s) => ({
    id: s.id,
    name: s.name,
    isPreset: s.isPreset,
    problemCount: s._count.problems,
    solvedCount: solvedIn.get(s.id) ?? 0,
  }));

  const defaultSheetId = sheetId ?? tabSheets[0]?.id;

  // "Start here" card — only for users who haven't solved anything yet.
  // Self-dismisses on the first solve; silently absent if the sheet is renamed.
  const blind75 = tabSheets.find((s) => /blind\s*75/i.test(s.name));
  const showStartHere = !showBank && !lastMinute && doneTotal === 0 && !!blind75;

  // Pre-fetch initial sheet data server-side to avoid a client-side loading skeleton.
  // Reuse the already-in-flight load when the sheet came from the URL; otherwise
  // load the default sheet (only knowable after the sheet-list query resolves).
  const [initialProblems, initialAllStatuses, initialNotesList] =
    knownSheetLoad
      ? await knownSheetLoad
      : defaultSheetId && !showBank
        ? await loadSheet(defaultSheetId)
        : [[], [], []];

  const initialSheetData = initialProblems.length > 0 ? {
    problems: initialProblems,
    total: initialProblems.length,
    filteredTotal: initialProblems.length,
    doneCount: initialAllStatuses.filter((s) => s.status === "DONE").length,
    solvingCount: initialAllStatuses.filter((s) => s.status === "SOLVING").length,
  } : null;

  const initialNotesMap: Record<string, string> = {};
  for (const n of initialNotesList) {
    if (n.problemId) initialNotesMap[n.problemId] = n.content;
  }

  return (
    <div className="flex gap-8 h-full">
      <div className="flex-1 min-w-0 space-y-5 animate-fade-up">
        {/* Header + view toggle */}
        <PageHeader
          eyebrow={showBank ? "Problem Bank" : lastMinute ? "Last Minute" : "DSA Sheets"}
          title={showBank ? "500 problems." : lastMinute ? "Tomorrow's the day." : "Solve by pattern,"}
          titleAccent={showBank ? "Pick your own." : lastMinute ? "Revise these." : "not by list."}
          subtitle={
            showBank
              ? "500 curated problems from top product companies. Add any to your custom sheets."
              : lastMinute
                ? "The must-do cut of this sheet — what to revise when the interview is tomorrow."
                : "Every problem is filed under the pattern that solves it, with the cue that identifies it."
          }
          trailing={
            <div className="flex items-center shrink-0 rounded-xl border border-border bg-surface p-1">
            <Link
              href={sheetId ? `/dashboard/dsa?sheet=${sheetId}` : "/dashboard/dsa"}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                !showBank && !lastMinute ? "bg-accent/15 text-accent" : "text-muted hover:text-secondary"
              }`}
            >
              My Sheets
            </Link>
            <Link
              href={sheetId ? `/dashboard/dsa?sheet=${sheetId}&view=lastminute` : "/dashboard/dsa?view=lastminute"}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                lastMinute ? "bg-accent/15 text-accent" : "text-muted hover:text-secondary"
              }`}
            >
              Last Minute
            </Link>
            <Link
              href="/dashboard/dsa?view=bank"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                showBank ? "bg-accent/15 text-accent" : "text-muted hover:text-secondary"
              }`}
            >
              Problem Bank
            </Link>
            </div>
          }
        />

        {/* ── Problem Bank view ── */}
        {showBank ? (
          <ProblemBank userSheets={userSheets} />
        ) : (
          <>
            {/* Start here — first-time users with zero solves */}
            {showStartHere && blind75 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/25 bg-accent/6 p-5">
                <div>
                  <p className="font-mono text-[13px] text-accent mb-1">Start here</p>
                  <p className="text-sm font-semibold text-primary">New? Begin with Blind 75.</p>
                  <p className="text-xs text-secondary mt-0.5">
                    75 problems covering every pattern that matters. Finish these before touching anything else.
                  </p>
                </div>
                <Link
                  href={`/dashboard/dsa?sheet=${blind75.id}`}
                  className="shrink-0 self-start sm:self-center rounded-lg bg-accent-fill text-black text-xs font-semibold px-3.5 py-2 hover:bg-accent-hover transition-colors"
                >
                  Open Blind 75 →
                </Link>
              </div>
            )}

            {/* Sheet tabs — handles delete + new sheet + add problems button */}
            {/* Fallback mirrors the selector's card shape so the row doesn't
                reflow when the client component hydrates. */}
            <Suspense fallback={
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {clientSheets.map((s, i) => (
                  <div key={s.id} className={`rounded-xl border p-3 ${
                    s.id === defaultSheetId ? "border-accent/40 bg-accent/10" : "border-border bg-surface"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                        s.id === defaultSheetId ? "bg-accent text-black" : "border border-border text-muted"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${
                          s.id === defaultSheetId ? "text-accent" : "text-primary"
                        }`}>{s.name}</span>
                        <span className="block font-mono text-[11px] text-muted">
                          {s.solvedCount} / {s.problemCount} solved
                        </span>
                      </span>
                    </div>
                    <span className="mt-2.5 block h-1 rounded-full bg-border" />
                  </div>
                ))}
                <div className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-accent/25 p-3 text-sm text-accent/60">
                  + New sheet
                </div>
              </div>
            }>
              <DSAPageClient sheets={clientSheets} activeSheetId={defaultSheetId} />
            </Suspense>

            {/* Stats bar + problem list — fully client-driven, reacts to tab clicks */}
            {tabSheets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
                <p className="text-secondary text-sm font-medium mb-1">No sheets yet</p>
                <p className="text-muted text-xs">Create a sheet above to get started.</p>
              </div>
            ) : (
              <SheetContent
                key={`${defaultSheetId}-${lastMinute ? "lm" : "all"}`}
                sheets={clientSheets}
                defaultSheetId={defaultSheetId}
                userId={userId}
                initialData={initialSheetData}
                initialNotes={initialNotesMap}
                lastMinute={lastMinute}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
