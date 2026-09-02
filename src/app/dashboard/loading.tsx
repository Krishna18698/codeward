import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Hero banner */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Practice grid */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Sheets section */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
