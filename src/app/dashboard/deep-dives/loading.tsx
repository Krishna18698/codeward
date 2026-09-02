import { Skeleton, ModeHeaderSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <ModeHeaderSkeleton ring={false} />
      {/* Featured card */}
      <Skeleton className="h-28 w-full rounded-2xl" />
      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
