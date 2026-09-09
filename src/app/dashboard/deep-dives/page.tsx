import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { DEEP_DIVES, categoryOf, CATEGORY_LABEL, type DeepDiveCategory } from "@/content/deep-dives";
import ReadBadge from "@/components/deep-dives/ReadBadge";
import PageHeader from "@/components/ui/PageHeader";

type Props = { searchParams: Promise<{ topic?: string }> };

/** A filter over one catalogue, not a separate mode — see the note on
 *  DeepDiveCategory. Driven by a search param so the page stays a server
 *  component, matching the `?view=` pattern already used on the DSA page. */
export default async function DeepDivesPage({ searchParams }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { topic } = await searchParams;
  const active: DeepDiveCategory | null =
    topic === "core-cs" ? "CORE_CS" : topic === "systems" ? "SYSTEMS" : null;

  const dives = active ? DEEP_DIVES.filter((d) => categoryOf(d) === active) : DEEP_DIVES;
  const [featured, ...rest] = dives;
  const avgMin = Math.round(dives.reduce((s, d) => s + d.minutes, 0) / dives.length);

  const filters: { href: string; label: string; on: boolean }[] = [
    { href: "/dashboard/deep-dives", label: `All ${DEEP_DIVES.length}`, on: active === null },
    {
      href: "/dashboard/deep-dives?topic=systems",
      label: CATEGORY_LABEL.SYSTEMS,
      on: active === "SYSTEMS",
    },
    {
      href: "/dashboard/deep-dives?topic=core-cs",
      label: CATEGORY_LABEL.CORE_CS,
      on: active === "CORE_CS",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <PageHeader
          eyebrow="Deep Dives"
          title="The topics every"
          titleAccent="senior loop covers."
          subtitle="Long-form deep dives — failure modes, trade-offs, and the interview traps that surface-level guides skip. Core CS here means the applied version: why a query got slower, not what a B-tree is."
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                f.on
                  ? "border-accent/40 bg-accent/12 text-accent"
                  : "border-border text-secondary hover:text-primary"
              }`}
            >
              {f.label}
            </Link>
          ))}
          <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-secondary">
            ~{avgMin} min avg
          </span>
        </div>
      </div>

      {/* Start here — featured card */}
      <Link
        href={`/dashboard/deep-dives/${featured.slug}`}
        className="block rounded-2xl border border-accent/25 bg-accent/6 p-5 hover:border-accent/40 transition-colors group"
      >
        <p className="font-mono text-[13px] text-accent mb-2">
          Start here{active ? ` · ${CATEGORY_LABEL[active]}` : ""}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-primary group-hover:text-accent-hover transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm text-secondary mt-1 max-w-2xl">{featured.hook}</p>
            <p className="mt-2 font-mono text-[11px] text-muted">
              {featured.tags.join(" · ")} · ~{featured.minutes} min
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-accent">Read →</span>
        </div>
      </Link>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rest.map((d, i) => (
          <Link
            key={d.slug}
            href={`/dashboard/deep-dives/${d.slug}`}
            className="flex flex-col rounded-2xl border border-border bg-surface p-5 hover:border-border hover:bg-elevated transition-colors group animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-primary group-hover:text-accent-hover transition-colors">
                {d.title}
              </h2>
              <ReadBadge slug={d.slug} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <span key={t} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
                  {t}
                </span>
              ))}
              {d.level && (
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                  {d.level}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-secondary leading-relaxed flex-1">{d.hook}</p>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted">
              <span>~{d.minutes} min</span>
              <span className="text-accent">Read →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
