import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex h-full gap-4">
      {/* Conversation list */}
      <div className="hidden w-64 shrink-0 space-y-2 md:block">
        <Skeleton className="h-9 w-full rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
      {/* Chat pane */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
          <Skeleton className="h-20 w-2/3 rounded-2xl" />
        </div>
        <Skeleton className="mt-4 h-12 w-full rounded-3xl" />
      </div>
    </div>
  );
}
