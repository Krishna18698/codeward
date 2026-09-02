import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-3 w-16 rounded-full" />
      <div className="max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>
        <div className="flex gap-6 border-t border-border pt-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}
