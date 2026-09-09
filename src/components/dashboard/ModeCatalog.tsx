import Link from "next/link";
import { Check } from "lucide-react";
import { Ring } from "@/components/ui/Ring";
import PageHeader from "@/components/ui/PageHeader";

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

/** Where the user is on this item. Drives the stripe, the chip and the dimming,
 *  so a catalog visibly changes as it gets worked through — previously status
 *  existed only as a filter, and the wall of cards looked identical forever. */
export type CatalogStatus = "not-started" | "attempted" | "mastered";

const STATUS: Record<CatalogStatus, { label: string; stripe: string; chip: string }> = {
  "not-started": { label: "Not started", stripe: "bg-border",        chip: "border-border text-muted" },
  attempted:     { label: "In progress", stripe: "bg-amber-400/70",  chip: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  mastered:      { label: "Mastered",    stripe: "bg-accent",        chip: "border-accent/30 bg-accent/10 text-accent" },
};

export type CatalogBadge = { label: string; tone?: BadgeTone };

export type CatalogItem = {
  href: string;
  title: string;
  badges?: CatalogBadge[];
  brief: string;
  meta: string;
  cta: string;
  status?: CatalogStatus;
  /** Optional right-aligned element (e.g. Build It stage dots). */
  trailing?: React.ReactNode;
};

export type CatalogFilter = { label: string; href: string; active: boolean };

type Props = {
  eyebrow: string;
  title: string;
  /** Second half of the title, in the accent colour. */
  titleAccent?: string;
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
  eyebrow, title, titleAccent, subtitle, statChips, progress, filterRows, items, emptyText,
}: Props) {
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        titleAccent={titleAccent}
        subtitle={subtitle}
        chips={statChips}
        trailing={
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Ring pct={pct} size={60} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-primary">{progress.done}/{progress.total}</span>
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{progress.label}</span>
          </div>
        }
      />

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

      {/* Cards — two-up from `sm`. A single column left ~400px of dead width to
          the right of every brief; two columns close it and halve the scroll. */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center">
          <p className="text-sm font-medium text-secondary">{emptyText ?? "Nothing matches that filter."}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((it, i) => {
            const st = it.status ? STATUS[it.status] : null;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 pl-6 transition-colors hover:border-border-accent hover:bg-elevated animate-fade-up ${
                  it.status === "mastered" ? "opacity-75 hover:opacity-100" : ""
                }`}
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                {/* Status as a stripe — readable at a glance across a grid,
                    without spending a whole row on a badge. */}
                {st && <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${st.stripe}`} />}

                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-primary transition-colors group-hover:text-accent-hover">
                    {it.title}
                  </h2>
                  {it.badges?.map((b, bi) => <Badge key={bi} {...b} />)}
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-secondary">{it.brief}</p>

                <p className="mt-2 font-mono text-[11px] text-muted">{it.meta}</p>

                {/* Pinned to the bottom so cards in a row share a baseline even
                    when their briefs differ in length. */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <div className="flex min-w-0 items-center gap-2">
                    {st && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${st.chip}`}>
                        {it.status === "mastered" && <Check size={9} aria-hidden />}
                        {st.label}
                      </span>
                    )}
                    {it.trailing}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-accent">{it.cta}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
