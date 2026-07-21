import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUG_HUNTS_META } from "@/content/bug-hunts";
import PreloadCodeEditor from "@/components/ui/PreloadCodeEditor";

const categoryColor: Record<string, string> = {
  concurrency: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  performance: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  "resource-leak": "text-rose-400 border-rose-500/30 bg-rose-500/10",
  correctness: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

export default async function BugHuntPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const playable = BUG_HUNTS_META;

  const attempts = await prisma.bugHuntAttempt.groupBy({
    by: ["exerciseSlug"],
    where: { userId },
    _max: { score: true },
    _count: { _all: true },
  });
  const bySlug = new Map(attempts.map((a) => [a.exerciseSlug, a]));

  return (
    <div className="space-y-6 animate-fade-up">
      <PreloadCodeEditor />
      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Bug Hunt</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">
          Diagnose the failure.
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
          Broken code, failing tests, real log excerpts. Find the root cause — not the
          symptom — write your diagnosis, and the AI grades it, then reveals the canonical fix.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            {BUG_HUNTS_META.length} exercises
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            all free
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            AI-graded
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {playable.map((ex, i) => {
          const stat = bySlug.get(ex.slug);
          const best = stat?._max.score ?? null;
          return (
            <Link
              key={ex.slug}
              href={`/dashboard/bug-hunt/${ex.slug}`}
              className="block rounded-2xl border border-neutral-800 bg-white/3 p-5 hover:border-neutral-700 hover:bg-white/5 transition-colors group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {ex.title}
                    </h2>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${categoryColor[ex.category] ?? "text-neutral-400 border-neutral-800"}`}>
                      {ex.category}
                    </span>
                    {best !== null && (
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${best >= 70 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}`}>
                        best {best}/100
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed max-w-2xl">{ex.brief}</p>
                  <p className="mt-2 font-mono text-[11px] text-neutral-500">
                    {ex.language} · ~{ex.minutes} min
                    {stat ? ` · ${stat._count._all} attempt${stat._count._all > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-emerald-400">
                  {best !== null ? "Try again →" : "Start debugging →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
