export const dynamic = "force-dynamic";

import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProblemBank from "@/components/dashboard/ProblemBank";
import DSAPageClient from "@/components/dashboard/DSAPageClient";
import SheetContent from "@/components/dashboard/SheetContent";

type Props = { searchParams: Promise<{ sheet?: string; view?: string }> };

export default async function DSAPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { sheet: sheetId, view } = await searchParams;
  const showBank = view === "bank";

  const [sheets, doneTotal] = await Promise.all([
    prisma.sheet.findMany({
      where: { OR: [{ isPreset: true }, { userId }] },
      include: { _count: { select: { problems: true } } },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
    }),
    prisma.userProblemStatus.count({ where: { userId, status: "DONE" } }),
  ]);

  // Custom sheets for the "add to sheet" dropdown in ProblemBank
  const userSheets = sheets
    .filter((s) => !s.isPreset)
    .map((s) => ({ id: s.id, name: s.name }));

  // Exclude the Top300 preset from the sheet tabs (it lives in Problem Bank)
  const tabSheets = sheets.filter((s) => s.source !== "TOP300");

  // Shape passed to the client component (safe to serialize — no dates/enums that break)
  const clientSheets = tabSheets.map((s) => ({
    id: s.id,
    name: s.name,
    isPreset: s.isPreset,
    problemCount: s._count.problems,
  }));

  const defaultSheetId = sheetId ?? tabSheets[0]?.id;

  // "Start here" card — only for users who haven't solved anything yet.
  // Self-dismisses on the first solve; silently absent if the sheet is renamed.
  const blind75 = tabSheets.find((s) => /blind\s*75/i.test(s.name));
  const showStartHere = !showBank && doneTotal === 0 && !!blind75;

  // Pre-fetch initial sheet data server-side to avoid client-side loading skeleton
  const [initialProblems, initialAllStatuses, initialNotesList] = defaultSheetId && !showBank
    ? await Promise.all([
        prisma.problem.findMany({
          where: { sheetId: defaultSheetId },
          select: {
            id: true, title: true, difficulty: true,
            pattern: true, mustDo: true, leetcodeUrl: true, gfgUrl: true,
            order: true, companies: true,
            statuses: { where: { userId }, select: { status: true, toRevise: true } },
          },
          orderBy: [{ mustDo: "desc" }, { order: "asc" }],
        }),
        prisma.userProblemStatus.findMany({
          where: { userId, problem: { sheetId: defaultSheetId } },
          select: { status: true },
        }),
        prisma.userNote.findMany({
          where: { userId, problem: { sheetId: defaultSheetId }, problemId: { not: null } },
          select: { problemId: true, content: true },
        }),
      ])
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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white truncate">
              {showBank ? "Problem Bank" : "DSA Sheets"}
            </h1>
            <p className="hidden md:block text-neutral-500 text-sm mt-1">
              {showBank
                ? "300 curated problems from top product companies. Add any to your custom sheets."
                : "Track your progress across patterns and problems."}
            </p>
          </div>

          <div className="flex items-center shrink-0 rounded-xl border border-neutral-800 bg-neutral-900/50 p-1">
            <Link
              href="/dashboard/dsa"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                !showBank ? "bg-emerald-500/15 text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              My Sheets
            </Link>
            <Link
              href="/dashboard/dsa?view=bank"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                showBank ? "bg-emerald-500/15 text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Problem Bank
            </Link>
          </div>
        </div>

        {/* ── Problem Bank view ── */}
        {showBank ? (
          <ProblemBank userSheets={userSheets} />
        ) : (
          <>
            {/* Start here — first-time users with zero solves */}
            {showStartHere && blind75 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/6 p-5">
                <div>
                  <p className="font-mono text-[13px] text-emerald-400 mb-1">Start here</p>
                  <p className="text-sm font-semibold text-white">New? Begin with Blind 75.</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    75 problems covering every pattern that matters. Finish these before touching anything else.
                  </p>
                </div>
                <Link
                  href={`/dashboard/dsa?sheet=${blind75.id}`}
                  className="shrink-0 self-start sm:self-center rounded-lg bg-emerald-500 text-black text-xs font-semibold px-3.5 py-2 hover:bg-emerald-400 transition-colors"
                >
                  Open Blind 75 →
                </Link>
              </div>
            )}

            {/* Sheet tabs — handles delete + new sheet + add problems button */}
            <Suspense fallback={
              <div className="flex gap-2 flex-wrap items-center">
                {clientSheets.map((s) => (
                  <div key={s.id} className={`rounded-xl px-3.5 py-1.5 text-sm border whitespace-nowrap ${
                    s.id === defaultSheetId
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "border-neutral-800 text-neutral-400"
                  }`}>
                    {s.name}
                    <span className="ml-2 text-[11px] opacity-50">{s.problemCount}</span>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-emerald-500/25 px-3.5 py-1.5 text-sm text-emerald-500/60">
                  + New sheet
                </div>
              </div>
            }>
              <DSAPageClient sheets={clientSheets} activeSheetId={defaultSheetId} />
            </Suspense>

            {/* Stats bar + problem list — fully client-driven, reacts to tab clicks */}
            {tabSheets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 px-5 py-16 text-center">
                <p className="text-neutral-400 text-sm font-medium mb-1">No sheets yet</p>
                <p className="text-neutral-500 text-xs">Create a sheet above to get started.</p>
              </div>
            ) : (
              <SheetContent
                key={defaultSheetId}
                sheets={clientSheets}
                defaultSheetId={defaultSheetId}
                userId={userId}
                initialData={initialSheetData}
                initialNotes={initialNotesMap}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
