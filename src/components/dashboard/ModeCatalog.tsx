import Link from "next/link";
import { Ring } from "@/components/ui/Ring";

// Shared, presentational catalog shell for the graded practice modes
// (Code Review / Bug Hunt / Build It). Server component — filtering is done by
// the page via URL search params (same pattern as System Design), so this just
// renders header + progress + filter chips + cards from already-computed data.

export type BadgeTone = "accent" | "amber" | "rose" | "sky" | "violet" | "muted";

const TONE: Record<BadgeTone, string> = {
  accent: "border-accent/30 bg-accent/10 text-accent",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  muted: "border-border text-muted",
};

export type CatalogBadge = { label: string; tone?: BadgeTone };

export type CatalogItem = {
  href: string;
  title: string;
  badges?: CatalogBadge[];
  brief: string;
  meta: string;
  cta: string;
  /** Optional right-aligned element (e.g. Build It stage dots). */
  trailing?: React.ReactNode;
};

export type CatalogFilter = { label: string; href: string; active: boolean };

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  statChips: string[];
  progress: { done: number; total: number; label: string };
  /** One or more filter rows (e.g. status, category). */
  filterRows?: CatalogFilter[][];
  items: CatalogItem[];
  emptyText?: string;
};

function Badge({ label, tone = "muted" }: CatalogBadge) {
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${TONE[tone]}`}>{label}</span>
  );
}

export default function ModeCatalog({
  eyebrow, title, subtitle, statChips, progress, filterRows, items, emptyText,
}: Props) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header: title/subtitle on the left, progress ring on the right */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-accent mb-2">{eyebrow}</p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-heading text-primary">{title}</h1>
          <p className="text-sm text-secondary mt-1 max-w-xl">{subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            {statChips.map((c, i) => (
              <span
                key={c}
                className={`rounded-full border px-2.5 py-1 ${
                  i === 1 ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-secondary"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex">
          <div className="relative">
            <Ring pct={pct} size={60} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-primary">{progress.done}/{progress.total}</span>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{progress.label}</span>
        </div>
      </div>

      {/* Filter chip rows (URL-param driven) */}
      {filterRows?.map((row, ri) => (
        <div key={ri} className="flex flex-wrap gap-1.5">
          {row.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              scroll={false}
              aria-current={f.active ? "true" : undefined}
              className={`rounded-xl px-3 py-1.5 text-xs transition-colors ${
                f.active
                  ? "border border-accent/30 bg-accent/15 text-accent"
                  : "border border-border text-secondary hover:text-primary"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      ))}

      {/* Cards */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
          <p className="text-sm font-medium text-secondary">{emptyText ?? "Nothing matches that filter."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <Link
              key={it.href}
              href={it.href}
              className="group block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-accent hover:bg-elevated animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-primary transition-colors group-hover:text-accent-hover">
                      {it.title}
                    </h2>
                    {it.badges?.map((b, bi) => <Badge key={bi} {...b} />)}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-secondary">{it.brief}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted">{it.meta}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  {it.trailing}
                  <span className="text-sm font-medium text-accent">{it.cta}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
