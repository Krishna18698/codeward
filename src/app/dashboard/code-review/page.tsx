import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CODE_REVIEWS_META } from "@/content/code-reviews";

export default async function CodeReviewPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const playable = CODE_REVIEWS_META.filter((e) => !e.locked);
  const locked = CODE_REVIEWS_META.filter((e) => e.locked);

  // Best score per exercise for this user
  const attempts = await prisma.reviewAttempt.groupBy({
    by: ["exerciseSlug"],
    where: { userId },
    _max: { score: true },
    _count: { _all: true },
  });
  const bySlug = new Map(attempts.map((a) => [a.exerciseSlug, a]));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Code Review</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">
          Pick a PR to review.
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
          Hand-authored diffs with planted bugs — the same class of issues a senior
          reviewer would catch. Write your review; the AI grades it against the
          ground-truth bug list.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            {CODE_REVIEWS_META.length} PRs
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            {playable.length} playable
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            TypeScript
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            AI-graded
          </span>
        </div>
      </div>

      {/* Playable exercise cards */}
      <div className="space-y-4">
        {playable.map((ex, i) => {
          const stat = bySlug.get(ex.slug);
          const best = stat?._max.score ?? null;
          return (
            <Link
              key={ex.slug}
              href={`/dashboard/code-review/${ex.slug}`}
              className="block rounded-2xl border border-neutral-800 bg-white/3 p-5 hover:border-neutral-700 hover:bg-white/5 transition-colors group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {ex.title}
                    </h2>
                    {best !== null && (
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                        best >= 70
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}>
                        best {best}/100
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed max-w-2xl">{ex.brief}</p>
                  <p className="mt-2 font-mono text-[11px] text-neutral-500">
                    {ex.language} · ~{ex.minutes} min · {ex.bugCount} planted issues
                    {stat ? ` · ${stat._count._all} attempt${stat._count._all > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-emerald-400">
                  {best !== null ? "Review again →" : "Start reviewing →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Coming soon */}
      {locked.length > 0 && (
        <div>
          <p className="font-mono text-[11px] text-neutral-500 mb-3">Coming soon · {locked.length}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((ex) => (
              <div key={ex.slug} className="rounded-2xl border border-neutral-800/60 bg-white/2 p-4 opacity-70">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-300">{ex.title}</h3>
                  <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] text-neutral-500">
                    <Lock size={9} /> soon
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">{ex.brief}</p>
                <p className="mt-2 font-mono text-[10px] text-neutral-600">
                  {ex.language} · ~{ex.minutes} min · {ex.bugCount} planted issues
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
