import type { ReactNode } from "react";

/** The section device, repeated everywhere.
 *
 *  Deliberately NOT part of PageHeader: this recurs *within* a page, several
 *  times, while PageHeader appears once at the top. Codeward used a mono eyebrow
 *  on some pages and nothing on others, so sections read as unrelated blocks.
 *  One device used everywhere is what makes a product feel authored by one hand.
 *
 *  Shape: a dotted chip, then a heading whose second half takes the accent —
 *  the same two-tone move PageHeader makes, one scale down. */
export default function SectionHeading({
  label, title, titleAccent, action,
}: {
  /** The dotted chip — a category, not a sentence. */
  label: string;
  title?: string;
  titleAccent?: string;
  /** Right-aligned slot, typically a "View all →" link. */
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
          {label}
        </span>

        {title && (
          <h2 className="mt-2 text-lg font-semibold leading-tight tracking-heading text-primary md:text-xl">
            {title}
            {titleAccent && <> <span className="text-accent">{titleAccent}</span></>}
          </h2>
        )}
      </div>

      {action && <div className="shrink-0 pb-0.5">{action}</div>}
    </div>
  );
}
