import { cn } from "@/lib/cn";

/** A single shimmering placeholder block. Shape/size via Tailwind classes
 *  (h-*, w-*, rounded-*). The shimmer is CSS (`.skeleton` in globals.css) and is
 *  auto-disabled under prefers-reduced-motion. Decorative, so aria-hidden. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Header block shared by every mode skeleton: eyebrow + title + subtitle,
 *  with an optional progress ring on the right (graded modes). */
export function ModeHeaderSkeleton({ ring = true }: { ring?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {ring && <Skeleton className="hidden h-[60px] w-[60px] shrink-0 rounded-full sm:block" />}
    </div>
  );
}

/** A row of filter-chip placeholders. */
export function FilterRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-xl" />
      ))}
    </div>
  );
}

/** A single catalog card placeholder (matches ModeCatalog's card). */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full max-w-xl" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-4 w-28 shrink-0" />
      </div>
    </div>
  );
}

/** Full skeleton for the graded-mode catalogs (Code Review / Bug Hunt / Build It),
 *  mirroring ModeCatalog: header + ring, one or two filter rows, a list of cards. */
export function CatalogSkeleton({
  filterRows = 1,
  cards = 5,
}: {
  filterRows?: number;
  cards?: number;
}) {
  return (
    <div className="space-y-6">
      <ModeHeaderSkeleton />
      {Array.from({ length: filterRows }).map((_, i) => (
        <FilterRowSkeleton key={i} count={i === 0 ? 4 : 4} />
      ))}
      <div className="space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
