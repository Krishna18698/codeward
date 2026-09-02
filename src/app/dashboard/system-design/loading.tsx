import { Skeleton, FilterRowSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-4">
        <FilterRowSkeleton count={4} />
        <FilterRowSkeleton count={4} />
      </div>
      <div className="flex items-start gap-8">
        <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-56 max-w-full" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-72 w-80 shrink-0 rounded-2xl xl:block" />
      </div>
    </div>
  );
}
