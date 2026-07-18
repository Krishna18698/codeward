import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExerciseMeta } from "@/content/code-reviews";
import CodeReviewWorkspace from "@/components/code-review/CodeReviewWorkspace";

type Props = { params: Promise<{ slug: string }> };

export default async function CodeReviewExercisePage({ params }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { slug } = await params;
  // Client-safe meta only — the planted bug list never enters this page's payload.
  const meta = getExerciseMeta(slug);
  if (!meta || !meta.files) notFound();

  const attempts = await prisma.reviewAttempt.findMany({
    where: { userId, exerciseSlug: slug },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, score: true, createdAt: true },
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <Link
        href="/dashboard/code-review"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <ArrowLeft size={12} /> All PRs
      </Link>

      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">PR · {meta.slug}</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">{meta.title}</h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">{meta.brief}</p>
        <p className="mt-2 font-mono text-[11px] text-neutral-500">
          {meta.language} · ~{meta.minutes} min · {meta.bugCount} planted issues
        </p>
      </div>

      <CodeReviewWorkspace
        slug={meta.slug}
        files={meta.files}
        bugCount={meta.bugCount}
        previousAttempts={attempts.map((a) => ({
          id: a.id,
          score: a.score,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
