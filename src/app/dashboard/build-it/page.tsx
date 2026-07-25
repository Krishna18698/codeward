import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUILD_IT_META } from "@/content/build-it";
import PreloadCodeEditor from "@/components/ui/PreloadCodeEditor";

const categoryColor: Record<string, string> = {
  concurrency: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  distributed: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  payments: "text-accent border-accent/30 bg-accent/10",
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
        <p className="font-mono text-[13px] text-accent mb-2">Build It</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-primary">
          Design it. Break it. Fix it.
        </h1>
        <p className="text-sm text-secondary mt-1 max-w-xl">
          Five real low-level-design problems, each evolving across 4 stages as new constraints
          break your last design. Stage 3 always asks you to prove a correctness invariant holds
          under concurrency — that&rsquo;s the senior filter.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-full border border-border px-2.5 py-1 text-secondary">
            {BUILD_IT_META.length} problems
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-accent">
            all free
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-secondary">
            4 stages each
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-secondary">
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
              className="block rounded-2xl border border-border bg-surface p-5 hover:border-border hover:bg-elevated transition-colors group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-primary group-hover:text-accent-hover transition-colors">
                      {p.title}
                    </h2>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${categoryColor[p.category] ?? "text-secondary border-border"}`}>
                      {p.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-secondary leading-relaxed max-w-2xl">{p.brief}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted">
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
                            ? "bg-accent-hover"
                            : s.stage <= highestUnlocked
                              ? "border border-border"
                              : "border border-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-accent">
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
