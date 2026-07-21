import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { DEEP_DIVES } from "@/content/deep-dives";
import ReadBadge from "@/components/deep-dives/ReadBadge";

export default async function DeepDivesPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [featured, ...rest] = DEEP_DIVES;
  const avgMin = Math.round(DEEP_DIVES.reduce((s, d) => s + d.minutes, 0) / DEEP_DIVES.length);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Deep Dives</p>
        <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-white">
          The topics every senior loop covers.
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-xl">
          Long-form deep dives — failure modes, trade-offs, and the interview traps that
          surface-level guides skip.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            {DEEP_DIVES.length} topics
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            all free
          </span>
          <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-neutral-400">
            ~{avgMin} min avg
          </span>
        </div>
      </div>

      {/* Start here — featured card */}
      <Link
        href={`/dashboard/deep-dives/${featured.slug}`}
        className="block rounded-2xl border border-emerald-500/25 bg-emerald-500/6 p-5 hover:border-emerald-500/40 transition-colors group"
      >
        <p className="font-mono text-[13px] text-emerald-400 mb-2">Start here</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">{featured.hook}</p>
            <p className="mt-2 font-mono text-[11px] text-neutral-500">
              {featured.tags.join(" · ")} · ~{featured.minutes} min
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-emerald-400">Read →</span>
        </div>
      </Link>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rest.map((d, i) => (
          <Link
            key={d.slug}
            href={`/dashboard/deep-dives/${d.slug}`}
            className="flex flex-col rounded-2xl border border-neutral-800 bg-white/3 p-5 hover:border-neutral-700 hover:bg-white/5 transition-colors group animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                {d.title}
              </h2>
              <ReadBadge slug={d.slug} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <span key={t} className="rounded-full border border-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
                  {t}
                </span>
              ))}
              {d.level && (
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                  {d.level}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed flex-1">{d.hook}</p>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span>~{d.minutes} min</span>
              <span className="text-emerald-400">Read →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
