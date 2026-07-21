import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUILD_IT_META } from "@/content/build-it";
import PreloadCodeEditor from "@/components/ui/PreloadCodeEditor";

const categoryColor: Record<string, string> = {
  concurrency: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  distributed: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  payments: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  api: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

export default async function BuildItPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const attempts = await prisma.buildItAttempt.groupBy({
    by: ["problemSlug", "stage"],
    where: { userId },
    _max: { score: true },
  });
  const stagesBySlug = new Map<string, Set<number>>();
  for (const a of attempts) {
    const set = stagesBySlug.get(a.problemSlug) ?? new Set<number>();
    set.add(a.stage);
    stagesBySlug.set(a.problemSlug, set);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PreloadCodeEditor />
      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Build It</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">
          Design it. Break it. Fix it.
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
          Five real low-level-design problems, each evolving across 4 stages as new constraints
          break your last design. Stage 3 always asks you to prove a correctness invariant holds
          under concurrency — that&rsquo;s the senior filter.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            {BUILD_IT_META.length} problems
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            all free
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            4 stages each
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            C# · Python · Kotlin
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {BUILD_IT_META.map((p, i) => {
          const done = stagesBySlug.get(p.slug) ?? new Set<number>();
          const highestUnlocked = Math.min(
            p.stages.length,
            [...done].reduce((max, s) => Math.max(max, s + 1), 1),
          );
          const startedAny = done.size > 0;
          return (
            <Link
              key={p.slug}
              href={`/dashboard/build-it/${p.slug}`}
              className="block rounded-2xl border border-neutral-800 bg-white/3 p-5 hover:border-neutral-700 hover:bg-white/5 transition-colors group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {p.title}
                    </h2>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${categoryColor[p.category] ?? "text-neutral-400 border-neutral-800"}`}>
                      {p.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed max-w-2xl">{p.brief}</p>
                  <p className="mt-2 font-mono text-[11px] text-neutral-500">
                    {p.stages.length} stages · ~{p.totalMinutes} min
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    {p.stages.map((s) => (
                      <span
                        key={s.stage}
                        title={`Stage ${s.stage}`}
                        className={`h-1.5 w-1.5 rounded-full ${
                          done.has(s.stage)
                            ? "bg-emerald-400"
                            : s.stage <= highestUnlocked
                              ? "border border-neutral-600"
                              : "border border-neutral-800"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    {startedAny ? "Continue →" : "Start designing →"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
