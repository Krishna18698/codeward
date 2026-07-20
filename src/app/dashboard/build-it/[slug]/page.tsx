import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBuildItMeta } from "@/content/build-it";
import BuildItWorkspace from "@/components/build-it/BuildItWorkspace";

type Props = { params: Promise<{ slug: string }> };

export default async function BuildItProblemPage({ params }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { slug } = await params;
  // Meta only — rubric / canonical approach / pitfalls never enter this page's payload.
  const problem = getBuildItMeta(slug);
  if (!problem) notFound();

  const attempts = await prisma.buildItAttempt.findMany({
    where: { userId, problemSlug: slug },
    orderBy: { createdAt: "desc" },
    select: { id: true, stage: true, score: true, createdAt: true },
  });

  const attemptedStages = new Set(attempts.map((a) => a.stage));
  const highestUnlockedStage = Math.min(
    problem.stages.length,
    [...attemptedStages].reduce((max, s) => Math.max(max, s + 1), 1),
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <Link
        href="/dashboard/build-it"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <ArrowLeft size={12} /> All problems
      </Link>

      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Build It · {problem.category}</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">{problem.title}</h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">{problem.brief}</p>
        <p className="mt-2 font-mono text-[11px] text-neutral-500">
          {problem.stages.length} stages · ~{problem.totalMinutes} min
        </p>
      </div>

      <BuildItWorkspace
        slug={problem.slug}
        problem={problem}
        previousAttempts={attempts.map((a) => ({
          id: a.id,
          stage: a.stage,
          score: a.score,
          createdAt: a.createdAt.toISOString(),
        }))}
        highestUnlockedStage={highestUnlockedStage}
      />
    </div>
  );
}
