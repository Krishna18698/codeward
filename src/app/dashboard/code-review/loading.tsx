import { CatalogSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <CatalogSkeleton filterRows={1} cards={6} />;
}
