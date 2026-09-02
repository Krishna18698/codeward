import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex h-full gap-8">
      <div className="min-w-0 flex-1 space-y-5">
        {/* Header + view toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-48 shrink-0 rounded-xl" />
        </div>
        {/* Sheet tabs */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-xl" />
          ))}
        </div>
        {/* Stats bar */}
        <Skeleton className="h-16 w-full rounded-2xl" />
        {/* Problem rows */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
