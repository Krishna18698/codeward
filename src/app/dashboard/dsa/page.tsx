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

  const sheets = await prisma.sheet.findMany({
    where: { OR: [{ isPreset: true }, { userId: userId }] },
    include: { _count: { select: { problems: true } } },
    orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
  });

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

  // Pre-fetch initial sheet data server-side to avoid client-side loading skeleton
  const [initialProblems, initialAllStatuses, initialNotesList] = defaultSheetId && !showBank
    ? await Promise.all([
        prisma.problem.findMany({
          where: { sheetId: defaultSheetId },
          select: {
            id: true, title: true, description: true, difficulty: true,
            pattern: true, mustDo: true, leetcodeUrl: true, gfgUrl: true,
            order: true, companies: true,
            statuses: { where: { userId: userId }, select: { status: true, toRevise: true } },
          },
          orderBy: [{ mustDo: "desc" }, { order: "asc" }],
        }),
        prisma.userProblemStatus.findMany({
          where: { userId: userId, problem: { sheetId: defaultSheetId } },
          select: { status: true },
        }),
        prisma.userNote.findMany({
          where: { userId: userId, problem: { sheetId: defaultSheetId }, problemId: { not: null } },
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
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">
              {showBank ? "Problem Bank" : "DSA Sheets"}
            </h1>
            <p className="hidden md:block text-slate-500 text-sm mt-1">
              {showBank
                ? "300 curated problems from top product companies. Add any to your custom sheets."
                : "Track your progress across patterns and problems."}
            </p>
          </div>

          <div className="flex items-center shrink-0 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
            <Link
              href="/dashboard/dsa"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                !showBank ? "bg-sky-500/15 text-sky-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              My Sheets
            </Link>
            <Link
              href="/dashboard/dsa?view=bank"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                showBank ? "bg-sky-500/15 text-sky-400" : "text-slate-500 hover:text-slate-300"
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
            {/* Sheet tabs — handles delete + new sheet + add problems button */}
            <Suspense fallback={
              <div className="flex gap-2 flex-wrap items-center">
                {clientSheets.map((s) => (
                  <div key={s.id} className={`rounded-xl px-3.5 py-1.5 text-sm border whitespace-nowrap ${
                    s.id === defaultSheetId
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      : "border-slate-800 text-slate-400"
                  }`}>
                    {s.name}
                    <span className="ml-2 text-[11px] opacity-50">{s.problemCount}</span>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-sky-500/25 px-3.5 py-1.5 text-sm text-sky-500/60">
                  + New sheet
                </div>
              </div>
            }>
              <DSAPageClient sheets={clientSheets} activeSheetId={defaultSheetId} />
            </Suspense>

            {/* Stats bar + problem list — fully client-driven, reacts to tab clicks */}
            {tabSheets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 px-5 py-16 text-center">
                <p className="text-slate-400 text-sm font-medium mb-1">No sheets yet</p>
                <p className="text-slate-600 text-xs">Create a sheet above to get started.</p>
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
