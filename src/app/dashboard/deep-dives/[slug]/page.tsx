import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { DEEP_DIVES, getDeepDive } from "@/content/deep-dives";
import { MarkRead } from "@/components/deep-dives/ReadBadge";
import DeepDiveReader from "@/components/deep-dives/DeepDiveReader";
import { splitSections } from "@/lib/deepDiveSections";

type Props = { params: Promise<{ slug: string }> };

export default async function DeepDivePage({ params }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { slug } = await params;
  const dive = getDeepDive(slug);
  if (!dive) notFound();

  const index = DEEP_DIVES.findIndex((d) => d.slug === slug);
  const prev = index > 0 ? DEEP_DIVES[index - 1] : null;
  const next = index < DEEP_DIVES.length - 1 ? DEEP_DIVES[index + 1] : null;
  const sections = splitSections(dive.body);

  return (
    <div className="flex gap-10 animate-fade-up">
      <MarkRead slug={slug} />

      {/* Article column */}
      <article className="min-w-0 max-w-3xl flex-1">
        <Link
          href="/dashboard/deep-dives"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-6"
        >
          <ArrowLeft size={12} /> All deep dives
        </Link>

        <p className="font-mono text-[13px] text-emerald-400 mb-2">
          Deep Dives <span className="text-neutral-600">/</span> {dive.title}
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-heading text-white leading-tight">
          {dive.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {dive.tags.map((t) => (
            <span key={t} className="rounded-full border border-neutral-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">{t}</span>
          ))}
          {dive.level && (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-300">{dive.level}</span>
          )}
          <span className="font-mono text-[11px] text-neutral-500">~{dive.minutes} min · {sections.length} sections</span>
        </div>
        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{dive.hook}</p>

        <div className="mt-8 border-t border-neutral-800 pt-8">
          <DeepDiveReader
            slug={slug}
            sections={sections}
            prerequisites={dive.prerequisites}
            afterThis={dive.afterThis}
            suggestedFirstPass={dive.suggestedFirstPass}
            references={dive.references}
          />
        </div>

        {/* Prev / next */}
        <div className="mt-12 border-t border-neutral-800 pt-6 flex items-stretch justify-between gap-4">
          {prev ? (
            <Link
              href={`/dashboard/deep-dives/${prev.slug}`}
              className="flex-1 rounded-xl border border-neutral-800 p-4 hover:border-neutral-700 transition-colors group"
            >
              <p className="font-mono text-[10px] text-neutral-500 mb-1">← Previous</p>
              <p className="text-xs font-medium text-neutral-300 group-hover:text-white">{prev.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link
              href={`/dashboard/deep-dives/${next.slug}`}
              className="flex-1 rounded-xl border border-neutral-800 p-4 text-right hover:border-neutral-700 transition-colors group"
            >
              <p className="font-mono text-[10px] text-neutral-500 mb-1">Next →</p>
              <p className="text-xs font-medium text-neutral-300 group-hover:text-white">{next.title}</p>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </article>

      {/* Topic rail — desktop only */}
      <aside className="hidden xl:block w-56 shrink-0">
        <div className="sticky top-20">
          <p className="font-mono text-[11px] text-neutral-500 mb-3">{DEEP_DIVES.length} topics</p>
          <nav className="space-y-1">
            {DEEP_DIVES.map((d) => (
              <Link
                key={d.slug}
                href={`/dashboard/deep-dives/${d.slug}`}
                aria-current={d.slug === slug ? "page" : undefined}
                className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  d.slug === slug
                    ? "bg-white/6 text-white"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/4"
                }`}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
